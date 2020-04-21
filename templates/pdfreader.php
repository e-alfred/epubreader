<?php
 /** @var array $_ */
  /** @var OCP\IURLGenerator $urlGenerator */
  $urlGenerator = $_['urlGenerator'];
  $downloadLink = $_['downloadLink'];
  $fileId = $_['fileId'];
  $fileName = $_['fileName'];
  $fileType = $_['fileType'];
  $scope = $_['scope'];
  $cursor = $_['cursor'];
  $defaults = $_['defaults'];
  $preferences = $_['preferences'];
  $metadata = $_['metadata'];
  $annotations = $_['annotations'];
  $title = htmlentities(basename($downloadLink));
  $revision = '0130';
  $version = \OCP\App::getAppVersion('files_reader') . '.' . $revision;

  /* Mobile safari, the new IE6 */
  $idevice = (strstr($_SERVER['HTTP_USER_AGENT'],'iPhone')
    || strstr($_SERVER['HTTP_USER_AGENT'],'iPad')
    || strstr($_SERVER['HTTP_USER_AGENT'],'iPod'));

  /* Owncloud currently does not implement CSPv3, remove this test when it does */
  $nonce = class_exists('\OC\Security\CSP\ContentSecurityPolicyNonceManager')
    ? \OC::$server->getContentSecurityPolicyNonceManager()->getNonce()
    : 'nonce_not_implemented';
?>

<html dir="ltr">
<head class="session" data-nonce='<?php p($nonce);?>' data-downloadlink='<?php print_unescaped($downloadLink);?>' data-fileid='<?php print_unescaped($fileId);?>' data-filetype='<?php print_unescaped($fileType);?>' data-filename='<?php print_unescaped($fileName);?>' data-version='<?php print_unescaped($version);?>' data-basepath='<?php p($urlGenerator->linkTo("files_reader",""));?>' data-scope='<?php print_unescaped($scope);?>' data-cursor='<?php print_unescaped($cursor);?>' data-defaults='<?php print_unescaped($defaults);?>' data-preferences='<?php print_unescaped($preferences);?>' data-metadata='<?php print_unescaped($metadata);?>' data-annotations='<?php print_unescaped($annotations);?>'>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <!-- <base href="<?php p($urlGenerator->linkTo('files_reader',''));?>"> -->
        <title>
            <?php p($title);?>
        </title>
        <link rel="shortcut icon" href="<?php p($urlGenerator->linkTo('files_reader', 'img/book.png')) ?>">
        <link rel="stylesheet" href="<?php p($urlGenerator->linkTo('files_reader', 'vendor/icomoon/style.css')) ?>?v=<?php p($version) ?>">
        <link rel="stylesheet" href="<?php p($urlGenerator->linkTo('files_reader', 'vendor/pdfjs/css/main.css')) ?>?v=<?php p($version) ?>">
		<link rel="stylesheet" href="<?php p($urlGenerator->linkTo('files_reader', 'vendor/pdfjs/css/sidebar.css')) ?>?v=<?php p($version) ?>">
        <link rel="stylesheet" href="<?php p($urlGenerator->linkTo('files_reader', 'vendor/pdfjs/css/text_layer_builder.css')) ?>?v=<?php p($version) ?>">
        <link rel="stylesheet" href="<?php p($urlGenerator->linkTo('files_reader', 'vendor/pdfjs/css/annotation_layer_builder.css')) ?>?v=<?php p($version) ?>">
		<script type="text/javascript" nonce="<?php p($nonce) ?>" src="<?php p($urlGenerator->linkTo('files_reader', 'vendor/epubjs/libs/jquery.min.js')) ?>?v=<?php p($version) ?>"> </script>
		<script type="text/javascript" nonce="<?php p($nonce) ?>" src="<?php p($urlGenerator->linkTo('files_reader', 'vendor/bartaz/jquery.highlight.js')) ?>?v=<?php p($version) ?>"> </script>
		<script type="text/javascript" nonce="<?php p($nonce) ?>" src="<?php p($urlGenerator->linkTo('files_reader', 'vendor/jquery/put-delete.js')) ?>?v=<?php p($version) ?>"> </script>
		<script type="text/javascript" nonce="<?php p($nonce) ?>" src="<?php p($urlGenerator->linkTo('files_reader', 'vendor/sindresorhus/screenfull.js')) ?>?v=<?php p($version) ?>"> </script>
		<script type="text/javascript" nonce="<?php p($nonce) ?>" src="<?php p($urlGenerator->linkTo('files_reader', 'vendor/pdfjs/lib/pdf.js')) ?>?v=<?php p($version) ?>"> </script>
		<script type="text/javascript" nonce="<?php p($nonce) ?>" src="<?php p($urlGenerator->linkTo('files_reader', 'vendor/pdfjs/pdf.reader.js')) ?>?v=<?php p($version) ?>"> </script>
		<script type="text/javascript" nonce="<?php p($nonce) ?>" src="<?php p($urlGenerator->linkTo('files_reader', 'vendor/pdfjs/services/eventbus_service.js')) ?>?v=<?php p($version) ?>"> </script>
		<script type="text/javascript" nonce="<?php p($nonce) ?>" src="<?php p($urlGenerator->linkTo('files_reader', 'vendor/pdfjs/services/link_service.js')) ?>?v=<?php p($version) ?>"> </script>
		<script type="text/javascript" nonce="<?php p($nonce) ?>" src="<?php p($urlGenerator->linkTo('files_reader', 'vendor/pdfjs/services/simple_link_service.js')) ?>?v=<?php p($version) ?>"> </script>
		<script type="text/javascript" nonce="<?php p($nonce) ?>" src="<?php p($urlGenerator->linkTo('files_reader', 'vendor/pdfjs/controllers/progress_controller.js')) ?>?v=<?php p($version) ?>"> </script>
		<script type="text/javascript" nonce="<?php p($nonce) ?>" src="<?php p($urlGenerator->linkTo('files_reader', 'vendor/pdfjs/controllers/textlayer_controller.js')) ?>?v=<?php p($version) ?>"> </script>
		<script type="text/javascript" nonce="<?php p($nonce) ?>" src="<?php p($urlGenerator->linkTo('files_reader', 'vendor/pdfjs/controllers/search_controller.js')) ?>?v=<?php p($version) ?>"> </script>
		<script type="text/javascript" nonce="<?php p($nonce) ?>" src="<?php p($urlGenerator->linkTo('files_reader', 'vendor/pdfjs/controllers/reader_controller.js')) ?>?v=<?php p($version) ?>"> </script>
		<script type="text/javascript" nonce="<?php p($nonce) ?>" src="<?php p($urlGenerator->linkTo('files_reader', 'vendor/pdfjs/controllers/sidebar_controller.js')) ?>?v=<?php p($version) ?>"> </script>
		<script type="text/javascript" nonce="<?php p($nonce) ?>" src="<?php p($urlGenerator->linkTo('files_reader', 'vendor/pdfjs/controllers/settings_controller.js')) ?>?v=<?php p($version) ?>"> </script>
		<script type="text/javascript" nonce="<?php p($nonce) ?>" src="<?php p($urlGenerator->linkTo('files_reader', 'vendor/pdfjs/controllers/controls_controller.js')) ?>?v=<?php p($version) ?>"> </script>
		<script type="text/javascript" nonce="<?php p($nonce) ?>" src="<?php p($urlGenerator->linkTo('files_reader', 'vendor/pdfjs/controllers/toc_controller.js')) ?>?v=<?php p($version) ?>"> </script>
		<script type="text/javascript" nonce="<?php p($nonce) ?>" src="<?php p($urlGenerator->linkTo('files_reader', 'vendor/pdfjs/controllers/outline_controller.js')) ?>?v=<?php p($version) ?>"> </script>
		<script type="text/javascript" nonce="<?php p($nonce) ?>" src="<?php p($urlGenerator->linkTo('files_reader', 'vendor/pdfjs/controllers/annotationlayer_controller.js')) ?>?v=<?php p($version) ?>"> </script>
		<script type="text/javascript" nonce="<?php p($nonce) ?>" src="<?php p($urlGenerator->linkTo('files_reader', 'vendor/pdfjs/controllers/notes_controller.js')) ?>?v=<?php p($version) ?>"> </script>
		<script type="text/javascript" nonce="<?php p($nonce) ?>" src="<?php p($urlGenerator->linkTo('files_reader', 'vendor/pdfjs/controllers/bookmarks_controller.js')) ?>?v=<?php p($version) ?>"> </script>
		<script type="text/javascript" nonce="<?php p($nonce) ?>" src="<?php p($urlGenerator->linkTo('files_reader', 'vendor/pdfjs/controllers/styles_controller.js')) ?>?v=<?php p($version) ?>"> </script>
        <?php if ($idevice): ?>
        <link rel="stylesheet" href="<?php p($urlGenerator->linkTo('files_reader', 'vendor/pdfjs/css/idevice.css')) ?>?v=<?php p($version) ?>">
		<script type="text/javascript" nonce="<?php p($nonce) ?>" src="<?php p($urlGenerator->linkTo('files_reader', 'vendor/bgrins/spectrum.js')) ?>?v=<?php p($version) ?>"> </script>
        <link rel="stylesheet" href="<?php p($urlGenerator->linkTo('files_reader', 'vendor/bgrins/spectrum.css')) ?>?v=<?php p($version) ?>">
        <?php endif; ?>

		<script type="text/javascript" nonce="<?php p($nonce) ?>" src="<?php p($urlGenerator->linkTo('files_reader', 'js/ready.js')) ?>?v=<?php p($version) ?>"> </script>
    </head>
    <body>
        <div id="outerContainer">

            <!-- progress -->

            <div id="progress" class="hide">
                <span class="progress"><span class="bar"></span></span>
                <br>
                <div class="message"><span class="message-icons"><span id="download_icon" class="icon-cloud_download"></span></span> <span class="message-text"></span></div>
            </div>

            <!-- /progress -->

            <!-- sidebar -->

            <div id="sidebar" class="sidebar">
                <div id="panels" class="panels">
                    <div class="pull-left">
                        <button id="show-Toc" class="show_view icon-dns open" title="Table of Contents" data-view="Toc"></button>
                        <button id="show-Outline" class="show_view icon-format_list_numbered" title="Outline" data-view="Outline"></button>
                        <!-- currently not used
                        <button id="show-Notes" class="show_view icon-comment" title="Annotations" data-view="Notes"></button>
                        -->
                        <button id="show-Bookmarks" class="show_view icon-turned_in" title="Bookmarks" data-view="Bookmarks"></button>
                        <button id="show-Search" class="show_view icon-search" title="Search" data-view="Search"></button>
                        <button id="show-Settings" class="show_view icon-settings" title="Settings" data-view="Settings"></button>
                    </div>
                    <div class="pull-right">
                        <button id="toc_populate" title="generate thumbnails" class="icon-sync" style="display:none"></button>
                        <button id="hide-Sidebar" class="close_sidebar icon-arrow-left2" title="Close sidebar"></button>
                    </div>
                </div>
                <div id="views">
                    <div id="tocView" class="toc-view view open">
                        <ul id="toc">
                        </ul>
                    </div>
                     <div id="outlineView" class="outline-view view">
                        <ul id="outline" class="outline">
                        </ul>
                    </div>

                    <!-- currently not used
                    <div id="notesView" class="notes-view view">
                        <div>
                            <div class="notes-input">
                                <textarea id="note-text" class="note-text" placeholder="Write note, press 'marker' button and select position in text to link note."></textarea>
                                <button id="note-anchor" class="note-anchor icon-room pull-right"></button>
                            </div>
                            <ol id="notes" class="notes">
                            </ol>
                        </div>
                    </div>
                    -->
                    <div id="bookmarksView" class="bookmarks-view view">
                        <ul id="bookmarks" class="bookmarks">
                        </ul>
                    </div>
                    <div id="searchView" class="view search-view">
                        <div>
                            <div class="search-input">
                                <input id="searchBox" class="searchbox" placeholder="search..." type="input">
                                <span title="Clear">x</span>
                                <button id="clear_search" class="icon-cancel pull-right" title="Clear"></button>
                            </div>
                            <ul id="searchResults" class="search-results">
                            </ul>
                        </div>
                    </div>
                    <div id="settingsView" class="settings-view view">
                        <fieldset class="settings-container" name="colour-settings">
                            <legend>colors</legend>
                            <fieldset>
                                <legend>night</legend>
                                <div class="control-group">
                                <form id="nightmode_form">
                                    <div class="center-box nightshift">
                                    nightmode can be toggled by clicking the nightmode button
                                    </div>
                                    <div class="control-group">
                                         <label title="adjust brightness">brightness</label>
                                         <input id="night_brightness" type="range" min="0" max="1" step="0.01" value="1">
                                    </div>
                                    <div class="control-group">
                                         <label title="adjust contrast">constrast</label>
                                         <input id="night_contrast" type="range" min="0" max="2" step="0.01" value="1">
                                    </div>
                                    <div class="control-group">
                                         <label title="adjust sepia">sepia</label>
                                         <input id="night_sepia" type="range" min="0" max="1" step="0.01" value="0">
                                    </div>
                                    <div class="control-group">
                                         <label title="adjust hue">hue</label>
                                         <input id="night_huerotate" type="range" min="0" max="359" step="1" value="0">
                                    </div>
                                    <div class="control-group">
                                         <label title="adjust saturation">saturation</label>
                                         <input id="night_saturate" type="range" min="0" max="5" step="0.01" value="1">
                                    </div>
                                    <div class="control-group">
                                        <input type="reset" id="nightmode_reset" name="nightmode_reset">
                                    </div>
                                    </form>
                                </div>
                            </fieldset>
                        </fieldset>
                        <fieldset class="settings-container" name="display-settings">
                            <legend>display</legend>
                            <div class="control-group">
                                <input type="checkbox" id="touch_nav" name="touch_nav">
                                <label for="touch_nav">
                                    disable extra-wide page turn areas
                                </label>
                            </div>
                            <div class="control-group">
                                <input type="checkbox" id="page_turn_arrows" name="page_turn_arrows">
                                <label for="page_turn_arrows">
                                    show page turn arrows
                                </label>
                            </div>
                            <div class="control-group">
                                <input type="checkbox" id="scrollToTop" name="scrollToTop">
                                <label for="scrollToTop">
                                    scroll to top of page on page turn
                                </label>
                            </div>

                        </fieldset>
                    </div>
                </div> <!-- views -->
            </div> <!-- sidebar -->

            <!-- /sidebar -->

            <!-- main -->

            <div id="main">

                <!-- titlebar -->

                <div id="titlebar">
                    <div id="opener">
                        <a id="slider" class="icon-menu">
                            <?php p($l->t("menu")); ?>
                        </a>
                        <div id="status_message_left">
                        </div>
                    </div>
                    <div id="metainfo">
                        <span id="book-title">
                        </span>
                        <span id="title-separator">
                              –  
                        </span>
                        <span id="page_num"></span>
                        <span id="page_num_separator">
                              /
                        </span>
                        <span id="total_pages">
                        </span>
                    </div>
                    <div id="title-controls">
                        <div id="status_message_right">
                        </div>
                        <div id="match_count">
                        </div>
                        <div id="nightmode" class="icon-brightness_low2 nightshift">
                        </div>
                        <span class="controls-separator"> </span>
                        <!-- select works fine, except for the fact that - as usual - apple mobile acts up... -->
                        <div id="zoom_options" class="hide">
                            <div class="zoom_option icon-double_page_mode" data-value="spread" data-class="icon-double_page_mode" data-text=""></div>
                            <div class="zoom_option icon-single_page_mode" data-value="fit_page" data-class="icon-single_page_mode" data-text=""></div>
                            <div class="zoom_option icon-icon-fit-width" data-value="fit_width" data-class="icon-icon-fit-width" data-text=""></div>
                            <div class="zoom_option" data-value="0.25" data-text="25%">25%</div>
                            <div class="zoom_option" data-value="0.5" data-text="50%">50%</div>
                            <div class="zoom_option" data-value="0.75" data-text="75%">75%</div>
                            <div class="zoom_option" data-value="1" data-text="100%">100%</div>
                            <div class="zoom_option" data-value="1.25" data-text="125%">125%</div>
                            <div class="zoom_option" data-value="1.5" data-text="150%">150%</div>
                            <div class="zoom_option" data-value="2" data-text="200%">200%</div>
                            <div class="zoom_option" data-value="3" data-text="300%">300%</div>
                            <div class="zoom_option" data-value="4" data-text="400%">400%</div>
                        </div>
                        <span id="zoom_icon"></span>
                        <span class="controls-separator"> </span>
                        <div id="rotate_options" class="hide">
                            <div class="rotate_option icon-rotate_0" data-value="0" data-class="icon-rotate_0" data-text=""></div>
                            <div class="rotate_option icon-rotate_90" data-value="90" data-class="icon-rotate_90" data-text=""></div>
                            <div class="rotate_option icon-rotate_180" data-value="180" data-class="icon-rotate_180" data-text=""></div>
                            <div class="rotate_option icon-rotate_270" data-value="270" data-class="icon-rotate_270" data-text=""></div>
                        </div>
                        <span id="rotate_left" class="icon-rotate_left"></span>
                        <span id="rotate_icon" class=icon-rotate_0"></span>
                        <span id="rotate_right" class="icon-rotate_right"></span>
                        <span class="controls-separator"> </span>
                        <a></a>
                        <a id="note" class="icon-comment">
                        </a>
                        <a id="bookmark" class="icon-turned_in_not">
                        </a>
                        <a id="fullscreen" class="icon-fullscreen">
                        </a>
                        <a id="close" class="icon-exit" style="display:none">
                        </a>
                    </div>
                </div>

                <!-- /titlebar -->

                <!-- divider -->

                <div id="divider">
                </div>

                <!-- /divider -->

                <!-- navigation + viewer -->

                <div id="prev" class="arrow">
                    <div class="translucent">
                        ‹
                    </div>
                </div>
                <div id="viewer" class="flex">
                    <canvas id="left" class="viewer"></canvas>
                    <div id="text_left" class="textLayer"></div>
                    <div id="annotations_left" class="annotationLayer"></div>
                    <canvas id="right" class="viewer"></canvas>
                    <div id="text_right" class="textLayer"></div>
                    <div id="annotations_right" class="annotationLayer"></div>
                </div>
                <div id="next" class="arrow">
                    <div class="translucent">
                        ›
                    </div>
                </div>
                <div id="loader">
                    <img src="<?php p($urlGenerator->linkTo('files_reader', 'img/loading.gif')) ?>">
                </div>

                <!-- /navigation + viewer -->

            </div>

            <!-- /main -->

            <div class="overlay">
            </div>
        </div>
    </body>
</html>
