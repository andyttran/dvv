module.exports = function(grunt) {

 
  grunt.initConfig({
      pkg: grunt.file.readJSON('package.json'),
 //     concat: {         
 //     },
      jshint: {
        options: {
          curly: true,
          eqeqeq: true,
          eqnull: true,
          browser: true,
          globals: {jQuery: true}
        },
        all: ['Gruntfile.js', 'server/**/*.js', 'client/**/*.js']
      }
  });

//  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  
  grunt.registerTask('default', ['jshint']);

};