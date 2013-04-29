from bottle import get, route, request, post, template, redirect, response, Bottle

from models import Users

import bottle

import hashlib

import os
import json
from json import dumps
filepath = os.getcwd()

bottle.TEMPLATE_PATH.insert(0, filepath + '/static/templates/')

secretkey = 84251450

app = Bottle()

@route('/test/cookie')
def setcookie():
    cookie_id = 'admin'
    response.set_cookie('session', cookie_id, secret=secretkey)
    return
    
@route('/test/remove')
def removecookie():
    response.delete_cookie('session')
    return
    
@route('/test/readcookie')
def removecookie():
    mycookie = request.get_cookie('session', default=None, secret=secretkey)
    return 'Cookie- %s ' %mycookie       

@route('/test')
@route('/test/users')
def register():
    userList = (Users.objects)
    return template('users.tpl', rows=userList)
 
@route('/test/register')
def register():
    return template('register.tpl')
    
@route('/test/register', method='POST')
def register_post():
    user = request.forms.get('user', '').strip()
    password = request.forms.get('pass', '').strip()
    hashedpw = hashlib.sha224(password).hexdigest()
    newUser = Users()
    newUser.username = request.forms.get('user', '').strip()
    newUser.password = hashedpw
    newUser.save()   
    redirect("/")
    
@route('/api/users', method='POST')
def register_post():
    # Read in request
    # Should be in format:
    # {'username': '<someusername>', 'password': '<somepassword>'}
    try :
        user = request.json['username']
        password = request.json['password']
    except :
        response.content_type = 'application/json'
        payload = { "error" : "missing username or password" }
        response.status = 400
        return
                
    # Hash password with sha 224 prior to storing
    hashedpw = hashlib.sha224(password).hexdigest()
    
    # Create a new instance of user and save it to the database
    newUser = Users()
    newUser.username = user
    newUser.password = hashedpw
    newUser.save()
    
    # Build response
    location = '/users/' + user    
    payload = { "location" : location }
    response.content_type = 'application/json'
    response.status = 201
    # Set session cookie
    response.set_cookie('session', newUser.username, secret=secretkey)
    return dumps(payload)

@route('/test/login')
def register():
    return template('login.tpl')
    
@route('/test/login', method='POST')
def register_post():
    
    username = request.forms.get('user', '').strip()
    password = request.forms.get('pass', '').strip()
    hashedpw = hashlib.sha224(password).hexdigest()
    
    newUser = Users.objects(username = username)
    
    if( newUser[0].password == hashedpw ):
        response.set_cookie('session', newUser[0].username, secret=secretkey)
        return 'Success'
    else:
        return 'Failed'
        
@route('/api/sessions', method='POST')
def login():
    # Read in request
    # Should be in format:
    # {'username': '<someusername>', 'password': '<somepassword>'}
    try :
        username = request.json['username']
        password = request.json['password']
    except :
        response.content_type = 'application/json'
        payload = { "error" : "missing username or password" }
        response.status = 400
        return dumps (payload)
        
    # Hash password with sha 224 prior to storing
    hashedpw = hashlib.sha224(password).hexdigest()
   
    # Attempt to retrieve user from the database
    newUser = Users.objects(username = username)
    
    if( newUser.count() == 0 ):
        response.content_type = 'application/json'
        payload = { "error" : "invalid username or password" }
        response.status = 400
        return dumps(payload)   
    
    # Check given password against what is in the database
    if( newUser[0].password == hashedpw ):
        # Build response
        location = '/users/' + username    
        payload = { "location" : location }
        response.content_type = 'application/json'
        response.status = 201
        # Set session cookie
        response.set_cookie('session', username, secret=secretkey)
        return dumps(payload)
    # Username or password were not valid.             
    else:
        response.content_type = 'application/json'
        payload = { "error" : "invalid username or password" }
        response.status = 400
        return dumps(payload)
   
        
