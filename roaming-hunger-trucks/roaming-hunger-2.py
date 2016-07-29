import requests
import json
import os
import bs4

root = 'http://roaminghunger.com'
days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
currentDirectory = os.getcwd()

with open('truck-urls.json', 'r') as json_data:
    data = json.load(json_data)
    for state in data.keys():
        newDir = currentDirectory + '/' + state

        if not os.path.exists(newDir):
            os.makedirs(newDir)
            print('created directory ' + state)
        os.chdir(newDir)
        for city in data[state]:
            currentDirectory = os.getcwd()
            print('currently in directory ' + currentDirectory)

            if not os.path.exists(currentDirectory + '/' + city):
                os.makedirs(currentDirectory + '/' + city)
                print('created directory ' + city)
            os.chdir(currentDirectory + '/' + city)
            for url in data[state][city]:
                truck = {}
                if not os.path.exists(url[25:-1] + '.json'):
                    response = requests.get(url)
                    soup = bs4.BeautifulSoup(response.text, 'html.parser')
                    try:
                        name = soup.h1.getText().strip(' \t\n\r')
                    except:
                        name = ''
                    truck['name'] = name
                    truck['username'] = ''
                    truck['password'] = ''
                    description = ''
                    try:
                        paragraphs = soup.select('.col-md-12 > p')
                        for paragraph in paragraphs:
                            description += paragraph.getText()
                    except:
                        description = ''

                    truck['description'] = description
                    try:
                        image = soup.select('.main_truck_image')[0].get('src')
                    except:
                        image = ''
                    truck['profileImage'] = root + image
                    truck['address'] = ''
                    truck['percentageFee'] = 6
                    truck['transactionFee'] = 30
                    truck['exampleOrder'] = ''
                    truck['optional'] = {}
                    truck['optional']['producer'] = {}
                    truck['optional']['producer']['enabled'] = True
                    truck['optional']['producer']['menuLink'] = ''
                    truck['optional']['producer']['phoneNumber'] = ''
                    truck['hours'] = []
                    for day in range(len(days)):
                        truck['hours'].append({})
                        truck['hours'][day]['day'] = days[day]
                        truck['hours'][day]['openTime'] = ''
                        truck['hours'][day]['closeTime'] = ''

                    # Get just the end of the url which is the name of the truck
                    file = open(url[25:-1] + '.json', 'w+') 
                    print('created file ' + url[25:-1] + '.json')
                    truckjson = json.dumps(truck, indent=2, sort_keys=True)
                    file.write(truckjson)
                    # print(truckjson)
                    file.close()

            os.chdir('..')
            currentDirectory = os.getcwd()
        os.chdir('..')
        currentDirectory = os.getcwd()


