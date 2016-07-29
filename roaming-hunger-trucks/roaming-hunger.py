import requests
import bs4
import json
import re

urls = {}

with open('city-urls.json', 'r') as json_data:
    data = json.load(json_data)
    for state in data.keys(): # gets each state
        print(state)
        urls[state] = {}
        for city_and_url in data[state]: # gets each city
            city = city_and_url["city"]
            urls[state][city] = []
            answer = requests.get(city_and_url["url"] + '1/')
            soup = bs4.BeautifulSoup(answer.text, 'html.parser')
            try:
                count = soup.select('.total')[0]
                count = count.getText()
                count = re.findall('\d+', count)
                count = int(count[0])
            except:
                count = 1

            pageCount = 0
            pageNum = 1
            while pageCount < count:
                pageNum += 1
                soup = bs4.BeautifulSoup(answer.text, 'html.parser')
                elems = soup.select('.bg')
                for elem in elems:
                    endUrl = elem.get('href')
                    print(pageCount, endUrl)
                    (urls[state][city]).append('http://roaminghunger.com' + endUrl)
                    pageCount += 1
                print(url)
                url = city_and_url['url'] + str(pageNum) + '/'
                answer = requests.get(url)


print(urls)            