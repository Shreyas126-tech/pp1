from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys

print("starting test...")
driver = webdriver.Chrome()
print("opening google...")
driver.get("https://www.google.com")
print("locating search box...")
search= driver.find_element(By.NAME, "q")
print("typing 'MIT college'...")
search.send_keys("MIT college")
search.send_keys(Keys.RETURN)
print("search executed successfully!")
input("Press Enter to close the browser...")
print("closing browser...")
driver.quit()
print("test completed.")