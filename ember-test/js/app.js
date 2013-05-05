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

var schedules = [
	App.Schedule.create({
		year: 2012,
		terms: [
			App.Term.create({
				term: 'Fall',
				classes: [ 'cpsc223', 'cpsc476', 'cpsc351']
			}),
			App.Term.create({
				term: 'Spring',
				classes: [ 'math150b', 'math270b', 'cpsc362']
			}),
			App.Term.create({
				term: 'Sumer',
				classes: [ 'math365', 'cpsc4eva']
			})
		]
	}),
	App.Schedule.create({
		year: 2013,
		terms: [
			App.Term.create({
				term: 'Fall',
				classes: [ 'cpsc551', 'cpsc433', 'cpsc462']
			}),
			App.Term.create({
				term: 'Spring',
				classes: [ 'cpsc551', 'cpsc433', 'cpsc462']
			}),
			App.Term.create({
				term: 'Sumer',
				classes: [ 'cpsc335', 'cpsc433']
			})
		]
	})
];

App.Class = Ember.Object.extend({
	name: null,
	number: 0,
	dept: null,
	prereqs: []
});

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


App.Router.map(function() {
	this.resource('schedule', {path: '/schedule/:year'});
	this.route('classes');
	this.route('departments');
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

App.ClassesRoute = Ember.Route.extend({
	model: function() {
		return classes;
	}
});

App.DepartmentsRoute = Ember.Route.extend({
	renderTemplate: function() {
		this.render({ outlet: 'sidebar' });
	},
	model: function() {
		return departments;
	}
});

App.ClassesController = Ember.ArrayController.extend({
	classes: classes,
	removeClass: function(course) {
		var removedCourse = this.classes.removeObject(course);
		console.log(removedCourse);
	}
});
