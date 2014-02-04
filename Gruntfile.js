module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    // See: http://www.jshint.com/docs/
    jshint: {
      all: {
        src: ['src/js/**.js'],
        options: {
          browser: true,
          bitwise: false,
          camelcase: false,
          curly: true,
          eqeqeq: true,
          forin: true,
          immed: true,
          ignores: ['src/vendor/**.js'],
          indent: 2,
          latedef: true,
          newcap: false,
          noarg: true,
          noempty: true,
          nonew: true,
          quotmark: 'single',
          regexp: true,
          undef: true,
          unused: false,
          trailing: true,
          maxlen: 520,
          globals: {
            $: false,
            jQuery: false,
            Error: false,
            console: false,
            escape: false,
            unescape: false
          }
        }
      }
    },
    watch: {
      files: ['src/js/**.js'],
      tasks: ['jshint']
    },
    connect: {
      server: {
        options: {
          port: 8888,
          hostname: '0.0.0.0',
          base: 'src'
        }
      }
    }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-connect');

  // Default task(s).
  grunt.registerTask('default', ['jshint', 'connect', 'watch']);

}
