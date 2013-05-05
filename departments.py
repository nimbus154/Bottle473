#!/usr/bin/env python
from bottle import get, post, put, request, response, HTTPResponse
from bottle import install, run

from bottle_mongo import MongoPlugin
from bson.objectid import ObjectId

install(MongoPlugin(uri='localhost', db='473', json_mongo=True))


@get('/departments/:abbrev')
def get_deparments_info(abbrev, mongodb):

    '''
    Input: Deparment Abbreviation
    Output: Department List

    Queries and returns all the deparments
    '''
    return mongodb.departments.find({'abbrev': ObjectId(abbrev) })
    
@get('/departments')
def get_deparments(mongodb):
    '''
    Input:
    Output: Department List

    Queries and returns all the deparments
    '''
    return mongodb.departments.find()

run(host='0.0.0.0', port=8080, debug=True, reloader=True)
