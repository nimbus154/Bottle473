var App = Ember.Application.create({
	LOG_TRANSITIONS: true
});

App.Schedule = Ember.Object.extend({
	year: null,
	terms: [ ]
});

App.Term = Ember.Object.extend({
	term: null,
	classes: []
});

App.Class = Ember.Object.extend({
	name: null,
	number: 0,
	dept: null,
	prereqs: []
});

var schedules = [
	App.Schedule.create({
		year: 2012,
		terms: [
			App.Term.create({
				term: 'Fall',
				classes: [ 
					App.Class.create({
						name: 'Python',
						number: 223,
						dept: 'cpsc',
						prereqs: ['cpsc131']
					}),
					App.Class.create({
						name: 'Web Programming',
						number: 473,
						dept: 'cpsc',
						prereqs: ['cpsc433']
					}),
					App.Class.create({
						name: 'Java Enterprise',
						number: 476,
						dept: 'cpsc',
						prereqs: ['cpsc362']
					})
				]
			}),
			App.Term.create({
				term: 'Spring',
				classes: [ 
					App.Class.create({
						name: 'Calculus II',
						number: '150b',
						dept: 'math',
						prereqs: ['math150a']
					}),
					App.Class.create({
						name: 'Math Structures II',
						number: '270b',
						dept: 'math',
						prereqs: ['math270a']
					})
				]
			}),
			App.Term.create({
				term: 'Summer',
				classes: [ 'math365', 'cpsc4eva']
			})
		]
	}),
	App.Schedule.create({
		year: 2013,
		terms: [
			App.Term.create({
				term: 'Fall',
				classes: [ 
					App.Class.create({
						name: 'Software Engineering',
						number: 362,
						dept: 'cpsc',
						prereqs: ['cpsc131']
					}),
					App.Class.create({
						name: 'Database Programming',
						number: 431,
						dept: 'cpsc',
						prereqs: ['cpsc332']
					}),
					App.Class.create({
						name: 'Programming Languages and Translation',
						number: 323,
						dept: 'cpsc',
						prereqs: ['cpsc240']
					})
				]
			}),
			App.Term.create({
				term: 'Spring',
				classes: [ 
					App.Class.create({
						name: 'Software Design',
						number: 462,
						dept: 'cpsc',
						prereqs: ['cpsc362']
					}),
					App.Class.create({
						name: 'Data Security and Encryption',
						number: 433,
						dept: 'cpsc',
						prereqs: ['cpsc131']
					}),
					App.Class.create({
						name: 'Distributed Systems',
						number: 551,
						dept: 'cpsc',
						prereqs: ['cpsc351']
					})
				]
			}),
			App.Term.create({
				term: 'Summer',
				classes: [
					App.Class.create({
						name: 'Algorithms',
						number: 335,
						dept: 'cpsc',
						prereqs: ['cpsc131']
					})
				]
			})
		]
	})
];

var classes = [
	App.Class.create({
		name: 'Data Structures',
		number: 131,
		dept: 'cpsc',
		prereqs: ['cpsc121']
	}),
	App.Class.create({
		name: 'Assembly Language',
		number: 240,
		dept: 'cpsc',
		prereqs: ['cpsc131']
	}),
	App.Class.create({
		name: 'Programming Languages and Translation',
		number: 323,
		dept: 'cpsc',
		prereqs: ['cpsc131', 'cpsc240']
	}),
	App.Class.create({
		name: 'Operating Systems Concepts',
		number: 351,
		dept: 'cpsc',
		prereqs: ['cpsc240']
	})
];

var departments = [
	{
		name: 'Computer Science',
		abbrev: 'cpsc'
	},
	{
		name: 'Math',
		abbrev: 'math'
	}
];

// thanks to http://jsfiddle.net/ud3323/5uX9H/ for drag n' drop tips
App.ClassesView = Ember.View.extend({
	templateName: 'classes',
	attributeBindings: 'draggable',
	draggable: 'true',
	dragStart: function(event) {
		console.log("Drag start");
	}
});

App.ClassView = Ember.View.extend({
	templateName: 'class',
	dragEnter: function(event) {
		event.preventDefault();
		console.log("drag enter canceled");
		return false;
	},
	dragOver: function(event) {
		event.preventDefault();
		console.log("drag over canceled");
		return false;
	},
	drop: function(event) {
		event.preventDefault();
		console.log("drop canceled");
		return false;
	}
});

App.Router.map(function() {
	this.resource('schedule', {path: '/schedule/:year'});
	this.route('masterList');
});

App.IndexRoute = Ember.Route.extend({
	renderTemplate: function() {
		this.transitionTo('schedule', new Date().getFullYear());
	}
});

App.ScheduleRoute = Ember.Route.extend({
	model: function(params) {
		return schedules.find(function(item) {
			return item.year == params.year;
		});
	}
});

App.MasterListRoute = Ember.Route.extend({
	model: function() {
		return classes;
	}
});

App.MasterListController = Ember.ArrayController.extend({
	classes: classes, 
	removeCourse: function(course) {
		classes.removeObject(course);
	},
	addCourse: function(course) {
		classes.addObject(course);
	}
});

App.TermController = Ember.ObjectController.extend({
	removeCourse: function(course) {
		this.get('content.classes').removeObject(course);
	},
	addCourse: function(course) {
		this.get('content.classes').addObject(course);
		console.log("DragOver!");
	},
	handleDragOver: function() {
		console.log("drag over");
		return false;
	},
	handleDrop: function() {
		console.log("Dropped!");
		return false;
	}
});

