from bottle import get, route, request, post, template, redirect

from models import Users

import bottle

import hashlib

import os
import json
filepath = os.getcwd()

bottle.TEMPLATE_PATH.insert(0, filepath + '/static/templates/')

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
    
    password = request.forms.get('pass', '').strip()
    hashedpw = hashlib.sha224(password).hexdigest()
    newUser = Users()
    newUser.username = request.forms.get('user', '').strip()
    newUser.password = hashedpw
    newUser.save()   
    redirect("/")

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
        return 'Success'
    else:
        return 'Failed'
