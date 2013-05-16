from bottle import get, route, request, static_file, error, post, default_app

import bottle
import users
import schedules
import departments

# Get relative filepath of server
import os
import json

filepath = os.getcwd()

bottle.TEMPLATE_PATH.insert(0, filepath + '/static/templates/')

@get('/')
def welcome():
    return server_static('login.html')

@get('/app')
def start_app():
   return server_static('app.html')
  
@get('/favicon.ico')
def get_favicon():
    return server_static('images/favicon.ico')        
    
@route('/static/<filename:path>')
def server_static(filename):
    return static_file(filename, root='./static')    
    
@error(403)
def mistake403(code):
    return 'There is a mistake in your url!'

@error(404)
def mistake404(code):
    return 'Sorry, this page does not exist!~'      

os.chdir(os.path.dirname(__file__))
application = bottle.app()
