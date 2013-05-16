var App = Ember.Application.create({
    LOG_TRANSITIONS: true // show routes for debugging
});

// wait until we get all schedules; advanceReadiness called in ScheduleStore.all
App.deferReadiness(); 

// Since we don't have course descriptions, we'll use cat facts
App.Cat = {
    currentIndex: 0,
    facts: [
        'It has been scientifically proven that owning cats is good for our health and can decrease the occurrence of high blood pressure and other illnesses.',
        'Stroking a cat can help to relieve stress, and the feel of a purring cat on your lap conveys a strong sense of security and comfort.',
        'The ancient Egyptians were the first civilisation to realise the cat\'s potential as a vermin hunter and tamed cats to protect the corn supplies on which their lives depended.',
        'Sir Isaac Newton is not only credited with the laws of gravity but is also credited with inventing the cat flap.',
        'A cat has more bones than a human being; humans have 206 and the cat has 230 bones.',
        'A cat\'s hearing is much more sensitive than humans and dogs.',
        'The cat\'s tail is used to maintain balance.ÿ',
        'Cats see six times better in the dark and at night than humans.',
        'Cats eat grass to aid their digestion and to help them get rid of any fur in their stomachs.',
        'A healthy cat has a temperature between 38 and 39 degrees Celcius.',
        'Cats have the largest eyes of any mammal.',
        'The female cat reaches sexual maturity at around 6 to 10 months and the male cat between 9 and 12 months.',
        'A female cat will be pregnant for approximately 9 weeks or between 62 and 65 days from conception to delivery.ÿ',
        'The average litter of kittens is between 2 - 6 kittens.',
        'Ailurophile is the word cat lovers are officially called.',
        'Purring does not always indicate that a cat is happy. Cats will also purr loudly when they are distressed or in pain.',
        'All cats need taurine in their diet to avoid blindness. Cats must also have fat in their diet as they are unable to produce it on their own.',
        'In households in the UK and USA, there are more cats kept as pets than dogs. At least 35% of households with cats have 2 or more cats.',
        'When a cats rubs up against you, the cat is marking you with it\'s scent claiming ownership.',
        'About 37% of American homes today have at least 1 cat.',
        'Milk can give some cats diarrhea.',
        'The average lifespan of an outdoor-only cat is about 3 to 5 years while an indoor-only cat can live 16 years or much longer.',
        'On average, a cat will sleep for 16 hours a day.',
        'A domestic cat can run at speeds of 30 mph.',
        'The life expectancy of cats has nearly doubled over the last fifty years.',
        'Blue-eyed, white cats are often prone to deafness.',
        'The cat\'s front paw has 5 toes and the back paws have 4. Cats born with 6 or 7 front toes and extra back toes are called polydactl.',
        'An adult cat has 30 teeth, 16 on the top and 14 on the bottom.',
        'There are approximately 60,000 hairs per square inch on the back of a cat and about 120,000 per square inch on its underside.',
        'Cats and kittens should be acquired in pairs whenever possible as cat families interact best in pairs.',
        'In multi-cat households, cats of the opposite sex usually get along better.',
        'The first official cat show in the UK was organised at Crystal Palace in 1871.'
    ]
};

//////////////////////////
// MODELS AND DATASTORE //
//////////////////////////

App.User = null;
// synchronously retrieve user info from server
$.ajax({
    url: '/api/sessions',
    async: false,
    dataType: 'json',
    success: function(data) {
        App.User = data.username;
    },
    error: function() {
        // error retrieving credentials = not logged in
        document.location = '/';
    },
});

// mixin to extract common ajax retrieval functions
App.ObjectRetriever = Ember.Mixin.create({
    getObjects: function(url, successCallback) {
        var array = [];
        $.ajax({
            url: url,
            dataType: 'json',
            success: function(data) {
                // Ember's observer pattern magic lets this populate everywhere!
                array.addObjects(data);
                if(successCallback) {
                    successCallback(array);
                }
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
        $.ajax({
            url: this.url,
            type: 'post',
            // async: false, otherwise all four ajax calls for new year creation
            // get mixed together into one, and only one schedule will be
            // created
            async: false,
            // JQuery 1.9 treats empty response bodies as errors
            // 201 create has an empty response body :-/
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
    findCourse: function(dept, number) {
        return  this.get('courses').find(function(course) {
            return course.get('department') === dept && 
                    course.get('number') === number;
        });
    },
    save: function() {
        var _this = this;
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
                // TODO handle error
                console.log("Error saving " + _this.get('year') 
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
    department: null,
    prereqs: []
});

App.CourseCatalogFetcher = Ember.Object.createWithMixins(App.ObjectRetriever, {
    url: '/api/departments',
    all: function() {
        return this.getObjects(this.url);
    },
    courses: function(deptAbbrev) {
        var url = this.url + '/' + deptAbbrev.toUpperCase();
        var courses = [];
        this.getObjects(url, function(rawCourses) {
            rawCourses.forEach(function(rawCourse) {
                var course = App.Course.create(rawCourse);
                var nextFact = App.Cat.currentIndex++ % App.Cat.facts.length;
                var description = App.Cat.facts.objectAt(nextFact);
                course.set('description', description);
                courses.addObject(course);
            });
        });

        return courses;
    }
});

// This "return empty object, then inflate via observers" pattern is inspired by
// http://stackoverflow.com/questions/12064765/initialization-with-serialize-deserialize-ember-js
App.ScheduleStore = Ember.Object.createWithMixins(App.ObjectRetriever, {
    user: null,
    url: '/api/users/' + App.User + '/schedules',
    Schedules: function(callback) {
        // returns an array of year schedules
        var _this = this;
        var schedules = [];
        this.getObjects(this.url, function(rawSchedules) {
            // TODO handle ajax schedule load fail
            if(rawSchedules.length > 0) {
                var deserializedList = _this.deserializeList(rawSchedules);
                // asynchronously inflate the "schedules" array
                deserializedList.forEach(function(item) {
                    schedules.addObject(item);
                });
                deserializedList.sort(function(a, b) {
                    return a.get('year') - a.get('year'); 
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
        var yearSchedule = App.YearSchedule.create({
            semesters: [] // this fixes a bug that accumlated semesters
                          // across calls to this function
                          // ie: on the second call, it would return 8 semesters
        });
        yearSchedule.set('year', year);

        // create fall, winter, spring, summer terms
        App.SemestersEnum.forEach(function(term) {
            var semesterSchedule = App.SemesterSchedule.create({
                year: year,
                semester: term,
                courses: []
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

// thanks to http://jsfiddle.net/ud3323/5uX9H/ for drag n' drop tips
App.Draggable = Ember.Mixin.create({
    attributeBindings: 'draggable',
    draggable: 'true',
    dragStart: function(event) {
        var dataTransfer = event.dataTransfer;
        var course = this.get('context'); // the item being dragged
        dataTransfer.setData('application/json', JSON.stringify(course));
    }
});

App.CourseView = Ember.View.extend(App.Draggable, {
    templateName: 'course', 
    dragStart: function(event) {
        var dataTransfer = event.dataTransfer;
        var course = this.get('context'); // the item being dragged

        // this hack notes which list the item came from
        var sourceList = $('#' + event.target.id).parent().attr('id');
        // set as hash so it doesn't affect the ember object
        course['source'] = sourceList; 

        dataTransfer.setData('application/json', JSON.stringify(course));
    }
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
        var rawData = JSON.parse(event.dataTransfer.getData('application/json'));
        var sourceSemester = rawData.source;
        var targetSemester = this.get('context');
        delete rawData.source;
        var course = App.Course.create(rawData);
        this.get('controller').add(course, targetSemester, sourceSemester);
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

App.Lightbox = Ember.Mixin.create({
    click: function() {
        var view = Ember.View.create({
            context: this.get('context'),
            templateName: 'courseInfo'
        });
        var modal = $('#modal');
        modal.empty(); // clear old data
        view.appendTo(modal); // add new view
        modal.modal(); // render modal dialog
    }
});

App.CourseInfoView = Ember.View.extend(App.Lightbox);
App.CatalogCourseInfoView = Ember.View.extend(App.Lightbox);

/////////////////////////
// ROUTES, CONTROLLERS //
/////////////////////////

// TODO handle year not found
App.Router.map(function() {
    this.resource('schedule', {path: '/schedule/:year'});
    this.route('notfound', {path: '*:'});
});

// /
App.IndexRoute = Ember.Route.extend({
    renderTemplate: function() {
        var startingSchedule, thisYear = new Date().getFullYear();
        if(App.schedules.length === 0) {
            // create a year if user has no schedules
            startingSchedule = App.ScheduleStore.createYear(thisYear);
            App.schedules.addObject(startingSchedule);
        }
        else {
            // Retrieve existing schedule, preferably for this year
            startingSchedule = App.schedules.findProperty('year', thisYear);
            if(!startingSchedule) {
                startingSchedule = App.schedules[0];
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
        yearParam = parseInt(params.year); // the if below handles if this is NaN
        model = App.schedules.findProperty('year', yearParam);
        if(!model) {
            this.transitionTo('notfound');
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

// Controller for the /schedule/:year route
App.ScheduleController = Ember.ObjectController.extend({
    add: function(course, target, source) {
        var inList = target.findCourse(course.get('department'), course.get('number'));
        if(!inList) {
            // if item was dragged from another semester, remove it
            if(source) {
                var sourceTerm = this.get('content.semesters').findProperty('semester', source);
                // find course
                var oldCourse = sourceTerm.findCourse(course.get('department'), course.get('number'));
                sourceTerm.get('courses').removeObject(oldCourse);
                sourceTerm.save();
            }
            
            // add to target
            target.get('courses').addObject(course);
            target.save();
        }
    },
    remove: function(course) {
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
                semester.save();
            }
        });
    },
    addYear: function() {
        // get the largest year, add next one
        App.schedules.sort(function(a, b) {
            return a.get('year') - b.get('year');
        });

        var newYear = App.schedules[App.schedules.length - 1].get('year') + 1;
        var newSchedule = App.ScheduleStore.createYear(newYear);
        App.schedules.addObject(newSchedule);
        this.transitionToRoute('schedule', newSchedule);
    }
});
