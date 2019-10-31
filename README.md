
LTPA-scraper
============

![npm package version](https://img.shields.io/npm/v/ltpa-scraper.svg)

About
-----
LTPA-scraper scrapes the IBM WPS portal server website login form to receive an LTPA2 token. 

Install
-------
You can either install it as local dependency to a project, or install it globally to be able to use it on the command line.

To install <code>ltpa-scraper</code> globally, on the command line type the following:

    $ npm install -g ltpa-scraper
        
Once installed globally, you can run it from any location:

    $ ltpa-scraper --help
        

Usage Command Line
------------------

    $ ltpa-scraper --username <username> --password <password> --url https://wps-page.com [--verbose]

For example, the output of the command above could look like this:

	{
		"LtpaToken2": "EPBg/ahVx0LXue+fwP8it1NR87y7vKlbxAczk5qi0D1tHIgIaNs+Wr3UF5y29IHL6xqcThqc0HK7kbDjuLFk51H3tLfWv72lh+J5Fa9SqFph/2Jl7tauE0+aood++a+H+oOnBPWBz8RuSHZyuMrw5WVee7cRbNxCpaEBWTLVDV3Wt9COSNit2Mts+0nuSuBYDwiPUGxwL2kV3DDYFbcgxslGwPOx5TMIL4vFRQ4jEMxl6eg2M/tirvCsP+3eVxcbUk8+BXAMxHu+DyNIytNjR2RkYqFDTU9SbnsIg54G72f+FyVaKsObL/cAnWnmeKK3/+Y1k1pNUdHqRjpfZAael1gvJaH9CeO8SzfG2UJTuSKpaLkSzrXWDliaLWiUcLV3xrp/RMoscIkYi+2bKK4FQfL2vUPBjLhcED9w8taJLTw9v8AbHg9fKqzFPZA+bUGA4HK25X2m1M98a+aODQt6ixsWo+HPbVJdBRSthU2qscQTgLnW/6wQd17KVZ19M1kNywTawiyGIpefxgQR0uDgEg7p/EfooCiYkONwvbwPr8TmI8dCt6pDb0Y5xOalSnp9Pxyd1wIJS2l9SnL7HvMNlwA+zlGmcs1a2+dhP819s6Iag1941L10EpnLuQcGId0ugS+Vx4eXwtXvI3O4AK1Yj93djJSgELcblvA8/9awYVm5LB4bI9hIe9+AtxutBTzJOyS4v7wDoArB5AJLXvRKqba6TJGQLMsTTde1CSS43uA=",
		"JSESSIONID": "0000tCpWj6q-5kCiGSQ4uJRT9hp:1d0cq5mdh"
	}

Usage in Code
-------------
We assume that npm is installed and that the project already contains a package.json file. 
If not, then first initialize the project.

    $ npm init
      
Install <code>ltpa-scraper</code> as node module and save it to package.json:

    $ npm install ltpa-scraper --save

Add <code>ltpa-scraper</code> to your program with <code>require</code> 
and call <code>scrape()</code> with the username and password encapsulated within a 
configuration object:  

    const ltpaScraper = require('ltpa-scraper');
    const options = {
        url: 'https://wps-website',
        username: 'username',
        password: 'password',
        verbose: false
    }
    ltpaScraper.scrape(options)
        .then(tokens => {
            // Pretty print orders to console.
            console.log(JSON.stringify(tokens, null, 2));
        })
        .catch(error => {
            console.log('ERROR: Failed to load the tokens:');
            console.log(error);
        });


Development
===========

Unit tests
----------
To start the unit tests:

    $ npm run test
    
      
Code style 
----------
JavaScript project code style: 

https://github.com/standard/standard

Request npm package
-------------------
https://github.com/request/request#readme
