var App = Ember.Application.create({
	LOG_TRANSITIONS: true
});

var schedules = [
	{
		year: 2012,
		terms: [
			{
				term: 'Fall',
				classes: [ 'cpsc223', 'cpsc476', 'cpsc351']
			},
			{
				term: 'Spring',
				classes: [ 'math150b', 'math270b', 'cpsc362']
			},
			{
				term: 'Sumer',
				classes: [ 'math365', 'cpsc4eva']
			}
		]
	},
	{
		year: 2013,
		terms: [
			{
				term: 'Fall',
				classes: [ 'cpsc551', 'cpsc433', 'cpsc462']
			},
			{
				term: 'Spring',
				classes: [ 'cpsc551', 'cpsc433', 'cpsc462']
			},
			{
				term: 'Sumer',
				classes: [ 'cpsc335', 'cpsc433']
			}
		]
	}
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
	this.route('classes');
	this.route('departments');
});

App.IndexRoute = Ember.Route.extend({
	renderTemplate: function() {
		this.render({ outlet: 'sidebar' });
	}
});

App.ClassesRoute = Ember.Route.extend({
	renderTemplate: function() {
		this.render({ outlet: 'sidebar' });
	},
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
	removeClass: function(course) {
		var removedCourse = classes.removeObject(course);
		console.log(removedCourse);
	}
});
