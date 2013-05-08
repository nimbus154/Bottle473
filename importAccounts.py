import json
from pymongo import Connection

from models import Users

newUser = Users()
newUser.username = 'test'
newUser.password = '90a3ed9e32b2aaf4c61c410eb925426119e1a9dc53d4286ade99a809' # = test
newUser.save()

newUser = Users()
newUser.username = 'admin'
newUser.password = '58acb7acccce58ffa8b953b12b5a7702bd42dae441c1ad85057fa70b' # = admin
newUser.save()

