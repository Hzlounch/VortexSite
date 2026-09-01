import asyncio
from playwright.async_api import async_playwright
import os

async def verify():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1440, "height": 900})

        cwd = os.getcwd()

        pages_to_check = [
            ("index.html", "screenshot_index.png"),
            ("store.html", "screenshot_store.png"),
            ("news.html", "screenshot_news.png"),
            ("release-notes.html", "screenshot_changelog.png"),
            ("features.html", "screenshot_features.png"),
            ("support.html", "screenshot_support.png"),
            ("socials.html", "screenshot_socials.png"),
            ("download.html", "screenshot_download.png")
        ]

        for file_name, out_name in pages_to_check:
            url = f"file://{cwd}/{file_name}"
            print(f"Navigating to {url}")
            await page.goto(url)
            await page.wait_for_timeout(1000)
            await page.screenshot(path=out_name, full_page=False)

        await browser.close()

if __name__ == "__main__":
    asyncio.run(verify())
