from selenium import webdriver           
from selenium.webdriver.common.by import By 
from selenium.webdriver.common.keys import Keys
import time
print("continuous xpath search demo starting...")
driver=webdriver.Chrome()
driver.get("https://www.google.com")
time.sleep(3)
search_terms=["xpath examples","selenium Xpath tutorial","Xpath contains example"]
for term in search_terms:
    print(f"searching for: {term}")
    search=driver.find_element(By.NAME,"q")
    search.clear()
    time.sleep(1)
    for char in term:
        search.send_keys(char)
        time.sleep(0.1)
    time.sleep(1)
    search.send_keys(Keys.RETURN)
    time.sleep(5)
    driver.get("https://www.google.com")
    time.sleep(3)
input("Press Enter to close the browser...")
driver.quit()