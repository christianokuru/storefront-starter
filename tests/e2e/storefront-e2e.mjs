/**
 * Full storefront E2E in a real browser against a local engine (engine `npm run dev` + `npm run seed`, storefront `npm run dev`).
 *
 *   ENGINE_LOG=path/to/engine.log  (dev emails are printed there; used to follow verification/reset links)
 *   STORE=http://localhost:3001 ENGINE=http://localhost:3000 SHOTS=./e2e-shots
 *   STARTER=1 → checks a Starter-plan engine (no accounts, no discounts) instead.
 */
import { createRequire } from "node:module";
import { mkdirSync, readFileSync } from "node:fs";
const { chromium } = createRequire(import.meta.url)("playwright");

const STORE = process.env.STORE ?? "http://localhost:3001";
const ENGINE = process.env.ENGINE ?? "http://localhost:3000";
const SHOTS = process.env.SHOTS ?? "e2e-shots";
const LOG = process.env.ENGINE_LOG;
mkdirSync(SHOTS, { recursive: true });

let failures = 0;
const ok = (c, msg) => { console.log(`${c ? "✓" : "✗"} ${msg}`); if (!c) failures++; };
const shot = (p, name, full = false) => p.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: full });
const seen = (l, t = 8000) => l.waitFor({ timeout: t }).then(() => true, () => false);
/** First size that isn't sold out (stock changes as the suite places orders). */
const pickSize = (p) => p.locator('fieldset button:not([aria-label*="sold out"])').first().click();
const noHScroll = async (p, label) => ok(await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `${label}: no horizontal scroll`);
const badge = async (p) => Number((await p.getByTestId("cart-button").getAttribute("aria-label")).match(/(\d+) item/)?.[1] ?? -1);
const waitBadge = async (p, n) => { for (let i = 0; i < 40; i++) { if ((await badge(p)) === n) return true; await p.waitForTimeout(150); } return false; };
const lastLink = (re) => { const all = [...readFileSync(LOG, "utf8").matchAll(re)]; return all.at(-1)?.[0]; };

const browser = await chromium.launch();
let current = null; // page being tested (for a screenshot if something crashes)

async function desktopFlow() {
	const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
	const p = (current = await ctx.newPage());
	const errors = [];
	p.on("pageerror", (e) => errors.push(e.message));
	p.on("dialog", (d) => d.accept());

	// ---- Browse
	await p.goto(STORE, { waitUntil: "networkidle" });
	ok(await p.getByRole("heading", { name: "Latest" }).isVisible(), "home renders products from the engine");
	ok((await p.locator('main a[href^="/products/"]').count()) >= 8, "home shows product cards");
	await shot(p, "01-home");
	await p.mouse.wheel(0, 2500); await p.waitForTimeout(400);
	await shot(p, "02-home-scrolled");

	await p.goto(`${STORE}/products?focus=search`);
	await p.getByRole("searchbox", { name: "Search products" }).fill("kaftan");
	await p.keyboard.press("Enter");
	await p.waitForURL(/q=kaftan/);
	ok(await p.getByText("1 item").isVisible(), "search finds 1 kaftan");
	await p.getByRole("searchbox", { name: "Search products" }).fill("zzzz-nothing");
	await p.keyboard.press("Enter");
	await p.waitForURL(/q=zzzz/);
	ok(await p.getByText(/Nothing found/).isVisible(), "empty search shows an empty state");
	await p.goto(`${STORE}/products`);
	await p.getByRole("navigation", { name: "Filter by category" }).getByRole("link", { name: "Women" }).click();
	await p.waitForURL(/category=women/);
	ok(await p.getByText("2 items").isVisible(), "category filter (Women → 2)");
	await shot(p, "03-category");

	// ---- Product page
	await p.goto(`${STORE}/products/ankara-wrap-dress`, { waitUntil: "networkidle" });
	ok(await p.locator("s[aria-label='Original price']").first().isVisible(), "sale price shows the original price struck through");
	ok((await p.locator('script[type="application/ld+json"]').count()) === 1, "product JSON-LD present (SEO)");
	await pickSize(p);
	await p.getByRole("main").getByRole("button", { name: "Increase quantity" }).click();
	await p.getByRole("button", { name: "Add to bag" }).click();
	ok(await waitBadge(p, 2), "add to bag (qty 2) updates the badge");
	const drawer = p.getByRole("dialog");
	ok(await drawer.getByText("Ankara Wrap Dress").isVisible(), "cart drawer opens with the item");
	await shot(p, "04-pdp-drawer");
	await drawer.getByRole("button", { name: "Increase quantity" }).click();
	ok(await waitBadge(p, 3), "drawer: quantity +1");
	await drawer.getByRole("button", { name: "Remove Ankara Wrap Dress" }).click();
	ok(await waitBadge(p, 0), "drawer: remove line");
	await p.keyboard.press("Escape");

	const sold = await p.goto(`${STORE}/products/indigo-bucket-hat`);
	ok(sold.status() === 200 && (await p.getByRole("button", { name: "Sold out" }).isDisabled()), "sold-out product can't be added");
	const draft = await p.goto(`${STORE}/products/leather-sandals`);
	ok(draft.status() === 404, "draft product is a 404");
	const junk = await p.goto(`${STORE}/products/%3Cscript%3E`);
	ok(junk.status() === 404, "junk handle is a 404 (no crash)");

	// ---- Cart persistence, tabs, stale cart
	await p.goto(`${STORE}/products/tie-dye-tote`);
	await p.getByRole("button", { name: "Add to bag" }).click();
	await waitBadge(p, 1);
	await p.keyboard.press("Escape");
	await p.goto(`${STORE}/products/aso-oke-cap`);
	await p.getByRole("button", { name: "Add to bag" }).click();
	ok(await waitBadge(p, 2), "two different products in the bag");
	await p.keyboard.press("Escape");
	await p.reload();
	ok(await waitBadge(p, 2), "bag survives a reload");
	const tab2 = await ctx.newPage();
	await tab2.goto(`${STORE}/cart`);
	ok(await waitBadge(tab2, 2), "second tab sees the same bag");
	await tab2.getByTestId("cart-line").first().waitFor();
	// Bump the cap (plenty of stock), not the kaftan whose sizes the suite keeps selling out.
	await tab2.getByTestId("cart-line").filter({ hasText: "Aso-Oke Cap" }).getByRole("button", { name: "Increase quantity" }).click();
	ok(await waitBadge(tab2, 3), "tab 2 updated its own bag");
	ok(await waitBadge(p, 3), "change in tab 2 syncs to tab 1 (no reload)");
	await tab2.close();

	// ---- Currency
	await p.getByRole("combobox", { name: "Currency" }).first().selectOption("USD");
	await p.waitForTimeout(1500);
	await p.goto(`${STORE}/products`);
	await p.getByRole("heading", { name: "Shop all" }).waitFor();
	ok(/\$|US\$/.test(await p.locator("main").innerText()), "prices switch to USD");
	ok(await waitBadge(p, 3), "bag moved to USD with all items");
	await p.getByRole("combobox", { name: "Currency" }).first().selectOption("NGN");
	await p.waitForTimeout(1500);
	await p.goto(`${STORE}/products`);
	await p.getByRole("heading", { name: "Shop all" }).waitFor();
	ok((await p.locator("main").innerText()).includes("₦"), "back to NGN");

	// ---- Checkout (guest) + successful payment
	await p.goto(`${STORE}/checkout`, { waitUntil: "networkidle" });
	ok(await p.getByTestId("pay").isDisabled(), "pay is disabled until details are complete");
	const fillAddress = async (email) => {
		await p.fill("#email", email);
		await p.fill("#firstName", "Adaeze");
		await p.fill("#lastName", "Okafor");
		await p.fill("#address1", "12 Admiralty Way");
		await p.fill("#city", "Lekki");
		await p.fill("#province", "Lagos");
		await p.selectOption("#countryCode", "NG");
		await p.fill("#phone", "+2348012345678");
		await p.getByRole("button", { name: "Continue to delivery" }).click();
	};
	await shot(p, "05-checkout-empty", true);
	await fillAddress("adaeze@example.com");
	await p.getByText("Lagos Standard").waitFor();
	await p.getByText("Lagos Standard").click();
	await p.waitForTimeout(600);
	await p.getByRole("textbox", { name: "Discount code" }).fill("NOPE");
	await p.getByRole("button", { name: "Apply" }).click();
	ok(await p.getByRole("alert").filter({ hasText: /invalid/i }).first().waitFor({ timeout: 8000 }).then(() => true, () => false), "invalid discount code shows an error");
	await p.getByRole("textbox", { name: "Discount code" }).fill("WELCOME10");
	await p.getByRole("button", { name: "Apply" }).click();
	await p.getByText("applied", { exact: true }).waitFor();
	ok(await p.getByText(/Discount \(WELCOME10\)/).isVisible(), "WELCOME10 applied, shown in summary");
	ok(await p.getByText(/test mode/).first().isVisible(), "payment methods listed (local test mode)");
	await shot(p, "06-checkout-ready", true);
	ok(!(await p.getByTestId("pay").isDisabled()), "pay enabled once ready");
	await p.getByTestId("pay").click();
	await p.waitForURL(`${ENGINE}/dev/pay**`);
	await shot(p, "07-test-payment-page");
	await p.getByRole("button", { name: /^Pay / }).click();
	await p.waitForURL(`${STORE}/checkout/complete**`);
	await p.getByTestId("complete-succeeded").waitFor();
	ok(await p.getByText(/Order #\d+/).isVisible(), "payment succeeded → order number shown");
	ok(await waitBadge(p, 0), "bag cleared after a successful order");
	await shot(p, "08-order-complete");

	// ---- Declined + cancelled payments
	await p.goto(`${STORE}/products/tie-dye-tote`);
	await p.getByRole("button", { name: "Add to bag" }).click();
	await waitBadge(p, 1);
	await p.goto(`${STORE}/checkout`);
	await fillAddress("adaeze@example.com");
	await p.getByText("Lagos Standard").click();
	await p.waitForTimeout(600);
	await p.getByTestId("pay").click();
	await p.waitForURL(`${ENGINE}/dev/pay**`);
	await p.getByRole("button", { name: "Simulate a declined card" }).click();
	await p.getByTestId("complete-failed").waitFor();
	ok(await waitBadge(p, 1), "declined payment: bag is kept");
	await shot(p, "09-payment-failed");
	await p.getByRole("link", { name: "Back to checkout" }).click();
	await p.getByTestId("pay").click();
	await p.waitForURL(`${ENGINE}/dev/pay**`);
	await p.getByRole("button", { name: /Cancel/ }).click();
	await p.waitForURL(`${STORE}/checkout`);
	ok(true, "cancelled payment returns to checkout");

	// ---- Stale / tampered cart cookies
	await ctx.addCookies([{ name: "nce_cart", value: "cart_01ARZ3NDEKTSV4RRFFQ69G5FAV", url: STORE }]);
	await p.goto(`${STORE}/cart`);
	ok(await seen(p.getByText("Your bag is empty").first()), "unknown cart id → treated as empty, no error");
	await ctx.addCookies([{ name: "nce_cart", value: "garbage%3Cx%3E", url: STORE }]);
	await p.goto(`${STORE}/products/aso-oke-cap`);
	await p.getByRole("button", { name: "Add to bag" }).click();
	ok(await waitBadge(p, 1), "tampered cart cookie → fresh cart works");
	await p.keyboard.press("Escape");

	// ---- Accounts
	const email = `ada.${Date.now()}@example.com`;
	await p.goto(`${STORE}/account/sign-up`);
	await p.fill("#name", "Ada Lovelace");
	await p.fill("#email", email);
	await p.fill("#password", "Lagos-Pass-2026");
	await shot(p, "10-sign-up");
	await p.getByRole("button", { name: "Create account" }).click();
	await p.getByText("Check your email").waitFor();
	ok(true, "sign-up → check your email");
	await p.goto(`${STORE}/account/sign-in`);
	await p.fill("#email", email);
	await p.fill("#password", "Lagos-Pass-2026");
	await p.getByRole("button", { name: "Sign in" }).click();
	ok(await seen(p.getByText("Please verify your email first")), "unverified sign-in → verify prompt + resend");
	await p.waitForTimeout(1500);
	const verify = lastLink(new RegExp(`${ENGINE.replace(/[.:/]/g, "\\$&")}/api/auth/verify-email\\?token=[^\\s"]+`, "g"));
	ok(Boolean(verify), "verification email logged by the engine");
	await p.goto(verify);
	await p.waitForURL(`${STORE}/account/verified**`);
	ok(await p.getByRole("heading", { name: "Email verified" }).isVisible(), "verification link lands on the storefront");
	await p.goto(`${STORE}/account/sign-in?next=/account`);
	await p.fill("#email", email);
	await p.fill("#password", "wrong-password-1");
	await p.getByRole("button", { name: "Sign in" }).click();
	ok(await seen(p.getByText("Email or password is incorrect.")), "wrong password → friendly error");
	await p.fill("#password", "Lagos-Pass-2026");
	await p.getByRole("button", { name: "Sign in" }).click();
	await p.waitForURL(`${STORE}/account`);
	await p.getByText("My account").waitFor();
	ok(await p.getByText(email).isVisible(), "signed in → account page");
	await shot(p, "11-account");

	await p.getByRole("navigation", { name: "Account sections" }).getByRole("link", { name: "Addresses" }).click();
	await p.getByRole("button", { name: "Add an address" }).click();
	await p.fill("#firstName", "Ada");
	await p.fill("#lastName", "Lovelace");
	await p.fill("#address1", "5 Bourdillon Rd");
	await p.fill("#city", "Ikoyi");
	await p.fill("#phone", "+2348099999999");
	await p.getByRole("button", { name: "Save address" }).click();
	await p.getByTestId("address").first().waitFor();
	ok((await p.getByTestId("address").count()) === 1, "address saved");
	await shot(p, "12-addresses");

	await p.goto(`${STORE}/checkout`);
	await p.waitForTimeout(1500);
	ok((await p.inputValue("#email")) === email, "signed-in checkout pre-fills email");
	ok(await p.getByRole("button", { name: /Bourdillon/ }).isVisible(), "saved address offered at checkout");
	await p.getByRole("button", { name: /Bourdillon/ }).click();
	await p.getByText("Lagos Standard").click();
	await p.waitForTimeout(600);
	await p.getByTestId("pay").click();
	await p.waitForURL(`${ENGINE}/dev/pay**`);
	await p.getByRole("button", { name: /^Pay / }).click();
	await p.getByTestId("complete-succeeded").waitFor();
	await p.getByRole("link", { name: "View my orders" }).click();
	await p.getByText(/Order #\d+/).first().waitFor();
	ok((await p.getByText(/Order #\d+/).count()) >= 1, "order appears in account");
	await p.locator('a[href^="/account/orders/"]').first().click();
	await p.getByText("Delivering to").waitFor();
	ok(await p.getByText("Aso-Oke Cap").isVisible(), "order detail shows items");
	await shot(p, "13-order-detail");

	await p.goto(`${STORE}/account/addresses`);
	await p.getByRole("button", { name: "Delete" }).click();
	ok(await p.getByTestId("address").waitFor({ state: "detached", timeout: 10000 }).then(() => true, () => false), "address deleted");

	await p.goto(`${STORE}/account`);
	await p.getByRole("button", { name: "Sign out" }).click();
	await p.waitForURL(STORE + "/");
	await p.goto(`${STORE}/account`);
	await p.waitForURL(/\/account\/sign-in/);
	ok(true, "signed out → account redirects to sign-in");

	await p.goto(`${STORE}/account/forgot-password`);
	await p.fill("#email", email);
	await p.getByRole("button", { name: "Send reset link" }).click();
	await p.getByText(/reset link is on its way/).waitFor();
	await p.waitForTimeout(1500);
	const reset = lastLink(new RegExp(`${ENGINE.replace(/[.:/]/g, "\\$&")}/api/auth/reset-password/[^\\s"]+`, "g"));
	ok(Boolean(reset), "reset email logged");
	await p.goto(reset);
	await p.waitForURL(`${STORE}/account/reset-password**`);
	await p.fill("#password", "New-Lagos-Pass-2026");
	await p.fill("#confirm", "New-Lagos-Pass-2026");
	await p.getByRole("button", { name: "Update password" }).click();
	await p.getByRole("heading", { name: "Password updated" }).waitFor();
	await p.goto(`${STORE}/account/sign-in?next=/account`);
	await p.fill("#email", email);
	await p.fill("#password", "New-Lagos-Pass-2026");
	await p.getByRole("button", { name: "Sign in" }).click();
	await p.waitForURL(`${STORE}/account`);
	ok(true, "password reset → sign in with the new password");

	ok(errors.length === 0, `no uncaught page errors${errors.length ? `: ${errors.join(" | ")}` : ""}`);
	await ctx.close();
}

async function mobileFlow() {
	const ctx = await browser.newContext({ ...(await import("node:module")).createRequire(import.meta.url)("playwright").devices["iPhone 13"] });
	const p = await ctx.newPage();
	for (const [path, name] of [["/", "m1-home"], ["/products", "m2-products"], ["/products/kampala-two-piece", "m3-pdp"], ["/checkout", "m5-checkout"], ["/account/sign-in", "m6-sign-in"]]) {
		await p.goto(STORE + path, { waitUntil: "networkidle" });
		await noHScroll(p, `mobile ${path}`);
		if (name === "m3-pdp") {
			await pickSize(p);
			await p.getByRole("button", { name: "Add to bag" }).click();
			await p.getByRole("dialog").waitFor();
			await shot(p, "m4-drawer");
			await p.keyboard.press("Escape");
		}
		await shot(p, name, name === "m5-checkout");
	}
	await p.getByRole("button", { name: "Open menu" }).click();
	await p.getByRole("navigation", { name: "Mobile" }).waitFor();
	await shot(p, "m7-menu");
	ok(await p.getByRole("navigation", { name: "Mobile" }).getByRole("link", { name: "Women" }).isVisible(), "mobile menu lists categories");
	await ctx.close();
}

async function starterFlow() {
	const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 } });
	const p = await ctx.newPage();
	await p.goto(STORE, { waitUntil: "networkidle" });
	ok((await p.getByRole("link", { name: "Account" }).count()) === 0, "Starter: no account link");
	ok((await p.goto(`${STORE}/account/sign-in`)).status() === 404, "Starter: account pages don't exist");
	await p.goto(`${STORE}/products/aso-oke-cap`);
	await p.getByRole("button", { name: "Add to bag" }).click();
	await waitBadge(p, 1);
	await p.goto(`${STORE}/checkout`, { waitUntil: "networkidle" });
	await p.waitForTimeout(1500);
	ok((await p.getByRole("textbox", { name: "Discount code" }).count()) === 0, "Starter: no discount box");
	ok((await p.getByText("Sign in for faster checkout").count()) === 0, "Starter: no sign-in prompt at checkout");
	await shot(p, "s1-starter-checkout", true);
	await ctx.close();
}

try {
	if (process.env.STARTER) await starterFlow();
	else { await desktopFlow(); await mobileFlow(); }
} catch (e) {
	failures++;
	console.error("✗ crashed:", e.message.split("\n")[0]);
	if (current) await current.screenshot({ path: `${SHOTS}/CRASH.png`, fullPage: true }).catch(() => {});
	if (current) console.error("  at", current.url());
	throw e;
} finally {
	await browser.close();
	console.log(failures ? `\n${failures} check(s) failed` : "\nAll storefront checks passed");
	process.exitCode = failures ? 1 : 0;
}
