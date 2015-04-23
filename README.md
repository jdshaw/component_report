Component Report plugin
=======================

Support selection of Resource and Archival Object records from search results, 
browse listings and the record tree view into a "cart" to allow for a component 
report to be generated.

## Installing it

To install, just activate the plugin in your config/config.rb file by
including an entry such as:

     # If you have other plugins loaded, just add 'component_report' to
     # the list
     AppConfig[:plugins] = ['local', 'other_plugins', 'component_report']

And then clone the `component_report` repository into your
ArchivesSpace plugins directory.  For example:

     cd /path/to/your/archivesspace/plugins
     git clone https://github.com/hudmol/component_report.git component_report
