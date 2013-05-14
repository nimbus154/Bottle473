var App = Ember.Application.create({
    LOG_TRANSITIONS: true // show routes for debugging
});

// wait until we get all schedules; advanceReadiness called in ScheduleStore.all
App.deferReadiness(); 

//////////////////////////
// MODELS AND DATASTORE //
//////////////////////////

App.User = 'admin';

// mixin to extract common ajax retrieval functions
App.ObjectRetriever = Ember.Mixin.create({
    getObjects: function(url, successCallback) {
        var array = [];
        $.getJSON(url, function(data) {
            // Ember's observer pattern magic lets this populate everywhere!
            array.addObjects(data);
            if(successCallback) {
                successCallback(array);
            }
        });
        return array;
    },
    all: null, // retrieve all objects
    find: null // retrieve an object
});

// helper object for grouping semesters by year
App.YearSchedule = Ember.Object.extend({
    year: null,
    semesters: []
});

// core business object, represents a student's schedule for a semester
App.SemesterSchedule = Ember.Object.extend({
    id: null,
    year: null,
    semester: null,
    courses: [],
    url: '/api/users/' + App.User + '/schedules',
    createRecord: function() {
        // create an empty schedule on the server
        var _this = this;
        if(this.get('id')) {
            throw new Error("Object already exists on server!");
        }
        console.log("Create record called");
        $.ajax({
            url: this.url,
            type: 'post',
            // JQuery 1.9 treats empty response bodies as errors
            // 201 create has an empty response body :-/
            async: false,
            error: function(xhr, status, error) {
                if(xhr.status === 201) {
                    // success, set ID
                    _this.set('id', xhr.getResponseHeader('Location'));
                    _this.save();
                }
                else {
                    // TODO replace with real error handling
                    console.log(error);
                }
            }
        });
    },
    save: function() {
        var _this = this;
        console.log('saving...');
        console.log(this);
        $.ajax({
            url: this.get('id'),
            type: 'put',
            contentType: 'application/json',
            processData: false,
            data: this.serialize(),
            success: function() { 
                console.log("Saved " + _this.get('year') 
                    + " " + _this.get('semester'));
            },
            error: function() {
                console.log("Saved " + _this.get('year') 
                    + " " + _this.get('semester'));
            }
        });
    },
    serialize: function() {
        var schedule = {};
        schedule.semester = this.get('semester');
        schedule.year = this.get('year');
        schedule.user_id = this.get('user_id');
        schedule.courses = this.get('courses');

        return JSON.stringify(schedule);
    }
});

// Possible semesters
App.SemestersEnum = [
    'FALL',
    'WINTER',
    'SPRING',
    'SUMMER'
];

// course associated with a semester
App.Course = Ember.Object.extend({
    name: null,
    number: null,
    dept: null,
    prereqs: []
});

App.CourseCatalogFetcher = Ember.Object.createWithMixins(App.ObjectRetriever, {
    url: '/api/departments',
    all: function() {
        return this.getObjects(this.url);
    },
    courses: function(deptAbbrev) {
        var url = this.url + '/' + deptAbbrev.toUpperCase();
        return this.getObjects(url);
    }
});

// This "return empty object, then inflate via observers" pattern is inspired by
// http://stackoverflow.com/questions/12064765/initialization-with-serialize-deserialize-ember-js
App.ScheduleStore = Ember.Object.createWithMixins(App.ObjectRetriever, {
    user: null,
    url: '/api/users/' + App.User + '/schedules',
    Schedules: function(callback) {
        // returns a hash of schedules by year
        // Each year is hashed by semester/term
        var schedules = [];
        var _this = this;
        this.getObjects(this.url, function(rawSchedules) {
            // TODO handle ajax schedule load fail
            if(rawSchedules.length > 0) {
                var deserializedList = _this.deserializeList(rawSchedules);
                // asynchronously inflate the "schedules" array
                deserializedList.forEach(function(item) {
                    schedules.addObject(item);
                });
            }
            callback();
        });
        return schedules;
    },
    deserializeList: function(schedules) {
        // Transform a list of server schedules into a YearSchedule
        var yearSchedules = [];
        var _this = this;
        var years = schedules.map(function(item) {
            return item.year;
        }).uniq();
        years.forEach(function(item) {
            var yearSchedule = App.YearSchedule.create({ year: item });

            var semesters = schedules.filterProperty('year', item).map(function(item) {
                return _this.deserializeSemester(item);
            }).sort(function(a, b) {
                // sort order: Fall, Winter, Spring, Summer
                var aOrder = App.SemestersEnum.indexOf(a.get('semester'));
                var bOrder = App.SemestersEnum.indexOf(b.get('semester'));
                return aOrder - bOrder;
            });

            yearSchedule.set('semesters', semesters);
            yearSchedules.addObject(yearSchedule);
        });
        return yearSchedules;
    },
    deserializeSemester: function(rawSemester) {
        var semester = App.SemesterSchedule.create({
            semester: rawSemester.semester,
            year: rawSemester.year
        });
        semester.set('id', this.url + '/' + rawSemester.id);
        var courses = rawSemester.courses.map(function(course) {
            return App.Course.create(course);
        });
        semester.set('courses', courses);
        return semester;
    },
    createYear: function(year, callback) {
        // create a new schedule year
        var context = this;
        
        // TODO bug with number of terms in year, after repeated creates
        var yearSchedule = App.YearSchedule.create();
        yearSchedule.set('year', year);

        // create fall, winter, spring, summer terms
        App.SemestersEnum.forEach(function(term) {
            var semesterSchedule = App.SemesterSchedule.create({
                year: year,
                semester: term
            });
            semesterSchedule.createRecord(); // create server record
            yearSchedule.get('semesters').addObject(semesterSchedule);
        });

        return yearSchedule;
    }
});

// get a list of all user schedules
App.schedules = App.ScheduleStore.Schedules(function() {
    // This call kicks off the application once data is fetched
    App.advanceReadiness();
});

/////////////////////////
//        VIEWS        //
/////////////////////////

App.Draggable = Ember.Mixin.create({
    attributeBindings: 'draggable',
    draggable: 'true',
    dragStart: function(event) {
        var dataTransfer = event.dataTransfer;
        var course = this.get('context'); // the item being dragged
        dataTransfer.setData('application/json', JSON.stringify(course));
        console.log("Dragging: ", course);
    }
});

// thanks to http://jsfiddle.net/ud3323/5uX9H/ for drag n' drop tips
App.CourseView = Ember.View.extend(App.Draggable, {
    templateName: 'course'
});


// defined inline; 
App.DeleteCourseView = Ember.View.extend({
    tagName: 'button',
    click: function(event) {
        var course = this.get('context');
        this.get('controller').remove(course);
    }
});

// defined inline
App.CatalogCourseView = Ember.View.extend(App.Draggable);

App.SemesterView = Ember.View.extend({
    templateName: 'semester',
    dragOver: function(event) {
        event.preventDefault();
        return false;
    },
    drop: function(event) {
        event.preventDefault();
        var rawData = event.dataTransfer.getData('application/json');
        var targetSemester = event.target.id;
        var course = App.Course.create(JSON.parse(rawData));
        this.get('controller').add(course, targetSemester);
        return false;
    }
});

// Handle logout
// Defined inline
App.LogoutView = Ember.View.extend({
    click: function() {
        $.ajax({
            url: '/api/sessions/' + App.User,
            type: 'delete',
            success: function() {
                // redirect to login page
                document.location = '/';
            },
            error: function() {
                // redirect to login page
                document.location = '/';
            }
        });
    }
});

/////////////////////////
// ROUTES, CONTROLLERS //
/////////////////////////

// TODO handle year not found
App.Router.map(function() {
    this.resource('schedule', {path: '/schedule/:year'});
});

// /
App.IndexRoute = Ember.Route.extend({
    renderTemplate: function() {
        var startingSchedule, thisYear = new Date().getFullYear();
        if(App.schedules.length === 0) {
            // create a year if user has no schedules
            console.log("NO schedules found");
            startingSchedule = App.ScheduleStore.createYear(thisYear);
            App.schedules.addObject(startingSchedule);
        }
        else {
            // Retrieve existing schedule, preferably for this year
            console.log("Schedules found");
            startingSchedule = App.schedules.findProperty('year', thisYear);

            if(!startingSchedule) {
                startingScehdule = App.schedules[0];
            }
        }
        this.transitionTo('schedule', startingSchedule);
    }
});

// /schedule/<year>
App.ScheduleRoute = Ember.Route.extend({
    setupController: function(controller, model) {
        controller.set('content', model);
    },
    model: function(params) {
        var model, yearParam;
        yearParam = parseInt(params.year); // TODO check for NaN
        model = App.schedules.findProperty('year', yearParam);
        // TODO fix model not found
        if(!model) {
            this.transitionTo('/');
        }
        return model;
    },
    serialize: function(model) {
        return { 'year': model.year };
    }
});

// Holds data for the list of courses on the left side of the screen
App.CourseCatalogController = Ember.ArrayController.extend({
    classes: App.CourseCatalogFetcher.courses('cpsc')
});

App.ScheduleController = Ember.ObjectController.extend({
    add: function(course, semesterName) {
        console.log('Adding ', course);
        var semester = this.get('content.semesters').findProperty('semester', semesterName);
        console.log("Found semesters", semester.get('semester'));
        console.log(semester);
        var inList = semester.get('courses').find(function(item) {
            return item.get('dept') === course.get('dept') && 
                    item.get('number') === course.get('number'); 
        });
        if(!inList) {
            // TODO first search through other semesters in same year and remove
            // class
            console.log("semester", semester.get('semester'));
            console.log(semester);
            semester.get('courses').addObject(course);
            semester.save();
        }
    },
    remove: function(course) {
        console.log('Removing', course);
        var semesters = this.get('content.semesters');
        semesters.forEach(function(semester) {
            // this looks insanely dangerous but it isn't
            // objects have unique identifiers, and so "course"
            // will only be removed from the term that has that exact instance
            var courses = semester.get('courses');
            var startingLength = courses.length;
            courses.removeObject(course);
            // save semester if item was removed
            if(courses.length < startingLength) {
                console.log("item removed from " + semester.get('semester'));
                semester.save();
            }
        });
    },
    addYear: function() {
        // get the largest year, add next one
        App.schedules.sort(function(a, b) {
            var aYear = a.get('year');
            var bYear = b.get('year');
            return aYear - bYear;
        });

        var newYear = App.schedules[App.schedules.length - 1].get('year') + 1;
        var newSchedule = App.ScheduleStore.createYear(newYear);
        App.schedules.addObject(newSchedule);
        this.transitionToRoute('schedule', newSchedule);
    }
});
