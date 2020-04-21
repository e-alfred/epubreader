## 1.2.3 - 2018-02-24
### Fixed
 - (#76) typo plus some missing code kept Reader from being used to preview shared files
 - (#79) typo kept Reader from being used by default for CBx
 - (#82) missing setDefault kept actual style settings from being saved

## 1.2.2 - 2018-02-02
### Fixed
 - (#75) NC and OC are diverging, NC encodes everything on $settings as JSON, OC does not yet.

## 1.2.1 - 2018-01-31
### Changed
 - change default settings to enabled for all supported mime types

## 1.2.0 - 2018-01-31
### Added
 - PDF: (#73) new preference 'scroll to top of page on page turn'
 - PDF: defaults and per-document settings are now saved and restored
 - PDF: nightmode (using CSS3 filters, only works in recent browsers), toggle with 'd', by clicking nightmode button or clicking in empty area on button bar, adjust in settings

### Changed
 - remove <base> from templates to avoid warning in console, <base> statement was ineffective anyway de to (overly restrictive) hardcoded policy in NC/OC.
 - removed (or rather disabled) merging of PDF annotations into user bookmarks as it only served to mess up the bookmark list and slowed things down. This feature can be re-enabled once Reader gains a functional PDF annotation editor.

### Fixed
 - PDF: (#72) $title not ['title'] in pdfreader template, hopefully the last remaining bug related to template refactoring
 - PDF: browsing the thumbnail list in single-page mode did not work as intended due to datatype mismatch in page calculation routine, fixed with explicit toString()
 - PDF: page 0 does not exist so don't try to go there

## 1.1.1 - 2018-01-19
### Added
 - signed package for publication in Owncloud marketplace

### Changed
 - updated bitjs unrar.js and rarvm.js

## 1.1.0 - 2018-01-18
### Added
 - Reader now supports PDF
 - PDF double page spreads are supported
 - optional double-buffering for faster rendering, can be disabled for low-memory devices
 - optional selectable text layer, can be disabled for low-memory devices

### Changed
 - #38: moved declarations in js/ready.js one level lower to work around a bug in the Palemoon browser
 - new version bitjs archive tools, fixes compatibility problems with some CBR files
 - increased maximum supported version for OC and NC

## 1.0.4 - 2017-04-09
### Fixed
 - #43, remove table aliases in hooks to avoid being bit by querybuilder/doctrine/MySQL incompatibility/idiosyncracy
 - #39, #41 and #42, NOTE: if you're on MySQL or MariaDB you might need to enable 4-byte support if this has not been done yet, otherwise you'll get a '1071 Specified key was too long' error on install. More information on this issue - which also occurs when trying to use Emoji characters in a NC/OC installation on a MySQL or MariaDB database - can be found here: https://docs.nextcloud.com/server/11/admin_manual/maintenance/mysql_4byte_support.html

## 1.0.3 - 2017-03-29
### Fixed
 - #40, detect shared file OR folder and (try to) get fileId for such when applicable

## 1.0.2 - 2017-03-25
### Fixed
 - #37, use getAppManager()->isInstalled('files_opds') instead of class_exists to avoid log spam

### Changed
 - new version bitjs unarchiver, increases compatibility with CBR files (at the cost of some speed)
 - move function declarations in js/ready.js down one block level so browsers which do not support
   ES6 (e.g. Palemoon) can find them. Unfortunately the above new version of bitjs uses another ES6 
   feature (classes) which Palemoon does not support so this change may be moot...

## 1.0.1 - 2017-03-19
### Fixed
 - #35: Internal Server Error: fixed path resolution so app works when NC/OC hosted in subdirectory

## 1.0.0 - 2017-03-15
### Added
 - Reader now supports CBR/CBZ ('comics') files
 - Book position ('cursor') is saved on server and restored on next invocation
 - Default settings (independent of fileid) and file-specific settings are saved and restored
 - Bookmarks and annotations (notes) are saved and restored (bookmarks are a type of annotation).
 - Full-text search implemented.
 - Framework to support more file format renderers
 - hooks added to remove defaults, settings and annotations/bookmarks for deleted files or users
 - epubreader
   * night mode now works more reliably
   * new 'day mode', ie. user-defined colours
   * new font settings: font weight
   * column width user-configurable
   * new mode: maximize reader area, for small-screen devices
   * page turn arrows optional, hidden by default
 - cbreader
   * supports CBR (rar) and CBZ (zip) archives
   * single and double page (spread) mode, auto-adjusts to screen geometry
   * optional image enhancement filters
   * seamless full screen mode (where browser allows user full control of experience, ie. not on apple)

## 0.8.3 - 2017-02-02
### Fixed
 . #31: ReferenceError: cleanStartTextContent is not defined, caused by failure to declare local var in epub.js

## 0.8.3 - 2017-02-01
### Fixed
 - missing $title parameter in template/reader.php caused warnings in log, fixed

## 0.8.2 - 2017-01-10
### Fixed
 - Nextcloud-port broke compatibility with Owncloud due to OC not supporting CSPv3, workaround implemented

## 0.8.1 - 2017-01-09
### Added
 - Modified info.xml, added screenshots

## 0.8.0 - 2017-01-09
### Added
 - new version 0.2.15 of Futurepress epub.js renderer

### Changed
 - New logo
 - First release to be compatible with Nextcloud
