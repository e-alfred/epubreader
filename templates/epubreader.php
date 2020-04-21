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
  $revision = '0072';
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
        <link rel="stylesheet" href="<?php p($urlGenerator->linkTo('files_reader', 'vendor/epubjs/css/main.css')) ?>?v=<?php p($version) ?>">
		<link rel="stylesheet" href="<?php p($urlGenerator->linkTo('files_reader', 'vendor/epubjs/css/sidebar.css')) ?>?v=<?php p($version) ?>">
        <link rel="stylesheet" href="<?php p($urlGenerator->linkTo('files_reader', 'vendor/epubjs/css/popup.css')) ?>?v=<?php p($version) ?>">
		<script type="text/javascript" nonce="<?php p($nonce) ?>" src="<?php p($urlGenerator->linkTo('files_reader', 'js/lib/typedarray.min.js')) ?>?v=<?php p($version) ?>"> </script>
		<script type="text/javascript" nonce="<?php p($nonce) ?>" src="<?php p($urlGenerator->linkTo('files_reader', 'js/lib/Blob.js')) ?>?v=<?php p($version) ?>"> </script>
		<script type="text/javascript" nonce="<?php p($nonce) ?>" src="<?php p($urlGenerator->linkTo('files_reader', 'js/lib/wgxpath.install.js')) ?>?v=<?php p($version) ?>"> </script>
		<script type="text/javascript" nonce="<?php p($nonce) ?>" src="<?php p($urlGenerator->linkTo('files_reader', 'vendor/epubjs/libs/jquery.min.js')) ?>?v=<?php p($version) ?>"> </script>
		<script type="text/javascript" nonce="<?php p($nonce) ?>" src="<?php p($urlGenerator->linkTo('files_reader', 'vendor/bartaz/jquery.highlight.js')) ?>?v=<?php p($version) ?>"> </script>
		<script type="text/javascript" nonce="<?php p($nonce) ?>" src="<?php p($urlGenerator->linkTo('files_reader', 'vendor/jquery/put-delete.js')) ?>?v=<?php p($version) ?>"> </script>
		<script type="text/javascript" nonce="<?php p($nonce) ?>" src="<?php p($urlGenerator->linkTo('files_reader', 'vendor/sindresorhus/screenfull.js')) ?>?v=<?php p($version) ?>"> </script>
		<script type="text/javascript" nonce="<?php p($nonce) ?>" src="<?php p($urlGenerator->linkTo('files_reader', 'vendor/epubjs/libs/zip.min.js')) ?>?v=<?php p($version) ?>"> </script>
		<script type="text/javascript" nonce="<?php p($nonce) ?>" src="<?php p($urlGenerator->linkTo('files_reader', 'vendor/epubjs/epub.min.js')) ?>?v=<?php p($version) ?>"> </script>
		<script type="text/javascript" nonce="<?php p($nonce) ?>" src="<?php p($urlGenerator->linkTo('files_reader', 'vendor/epubjs/hooks.min.js')) ?>?v=<?php p($version) ?>"> </script>
		<script type="text/javascript" nonce="<?php p($nonce) ?>" src="<?php p($urlGenerator->linkTo('files_reader', 'vendor/epubjs/hooks/extensions/highlight.js')) ?>?v=<?php p($version) ?>"> </script>
        <script type="text/javascript" nonce="<?php p($nonce) ?>" src="<?php p($urlGenerator->linkTo('files_reader', 'vendor/epubjs/reader.min.js')) ?>?v=<?php p($version) ?>"> </script>

        <?php if ($idevice): ?>
        <link rel="stylesheet" href="<?php p($urlGenerator->linkTo('files_reader', 'vendor/epubjs/css/idevice.css')) ?>?v=<?php p($version) ?>">
		<script type="text/javascript" nonce="<?php p($nonce) ?>" src="<?php p($urlGenerator->linkTo('files_reader', 'vendor/bgrins/spectrum.js')) ?>?v=<?php p($version) ?>"> </script>
        <link rel="stylesheet" href="<?php p($urlGenerator->linkTo('files_reader', 'vendor/bgrins/spectrum.css')) ?>?v=<?php p($version) ?>">
        <?php endif; ?>

		<script type="text/javascript" nonce="<?php p($nonce) ?>" src="<?php p($urlGenerator->linkTo('files_reader', 'js/ready.js')) ?>?v=<?php p($version) ?>"> </script>
    </head>
    <body>
        <div id="outerContainer">

            <!-- sidebar -->

            <div id="sidebar" class="sidebar">
                <div id="panels" class="panels">
                    <div class="pull-left">
                        <button id="show-Toc" class="show_view icon-format_list_numbered open" title="Table of Contents" data-view="Toc"></button>
                        <button id="show-Bookmarks" class="show_view icon-turned_in" title="Bookmarks" data-view="Bookmarks"></button>
                        <button id="show-Search" class="show_view icon-search" title="Search" data-view="Search"></button>
                        <button id="show-Notes" class="show_view icon-comment" title="Notes" data-view="Notes"></button>
                        <button id="show-Settings" class="show_view icon-settings" title="Settings" data-view="Settings"></button>
                    </div>
                    <div class="pull-right">
                        <button id="hide-Sidebar" class="close_sidebar icon-arrow-left2" title="Close sidebar"></button>
                    </div>
                </div>
                <div id="views">
                    <div id="tocView" class="toc-view view open">
                    </div>
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
                    <div id="settingsView" class="settings-view view">
                        <fieldset class="settings-container" name="font-settings">
                            <legend>font</legend>
                            <div class="control-group">
                                <div>
                                    <input type="checkbox" id="custom_font_family" name="font_family">
                                    <label for="custom_font_family">custom font</label>
                                    <select id="font_family" disabled="">
                                        <option value="verdana, trebuchet, droid sans serif, sans, sans-serif"> sans </option>
                                        <option value="georgia, times new roman, droid serif, serif"> serif </option>
                                        <option value="monospace"> monospace </option>
                                    </select>
                                </div>
                                <div>
                                    <input type="checkbox" id="custom_font_size" name="font_size">
                                    <label for="custom_font_size">font size</label>
                                    <input type="number" id="font_size" value="100" min="50" max="150" disabled=""> %
                                </div>
                                <div>
                                    <input type="checkbox" id="custom_font_weight" name="font_weight">
                                    <label for="custom_font_weight">font weight</label>
                                    <select id="font_weight" disabled="">
                                        <option value="100">thin</option>
                                        <option value="200">extra light</option>
                                        <option value="300">light</option>
                                        <option value="400">normal</option>
                                        <option value="500">medium</option>
                                        <option value="600">semi-bold</option>
                                        <option value="700">bold</option>
                                        <option value="800">extra bold</option>
                                        <option value="900">black</option>
                                    </select>
                                </div>
                                <div id="font_example" class="user font_example">
                                    <div>
                                    Et nos esse veri viri scire volemus
                                    </div>
                                </div>
                            </div>
                        </fieldset>
                        <fieldset class="settings-container" name="colour-settings">
                            <legend>colors</legend>
                            <fieldset>
                                <legend>normal</legend>
                                <div class="control-group">
                                    <input type="checkbox" id="use_custom_colors" name="use_custom_colors">
                                    <label for="use_custom_colors">
                                        Use custom colors
                                    </label>
                                    <div class="center-box">
                                    <input type="color" id="day_color" value="#0a0a0a">
                                    on
                                    <input type="color" id="day_background" value="#f0f0f0">
                                    </div>
                                    <div id="day_example" class="day font_example">
                                        <div>
                                            Et nos esse veri viri scire volemus
                                        </div>
                                    </div>
                                </div>
                            </fieldset>
                            <fieldset>
                                <legend>night</legend>
                                <div class="control-group">
                                    <div class="center-box nightshift">
                                    nightmode can be toggled by clicking the book title
                                    </div>
                                    <div class="center-box">
                                    <input type="color" id="night_color" value="#454545">
                                    on
                                    <input type="color" id="night_background" value="#000000">
                                    </div>
                                    <div id="night_example" class="night font_example">
                                        <div>
                                            Et nos esse veri viri scire volemus
                                        </div>
                                    </div>
                                </div>
                            </fieldset>
                        </fieldset>
                        <fieldset class="settings-container" name="display-settings">
                            <legend>display</legend>
                            <fieldset>
                                <legend>page width</legend>
                                <div class="control-group center-box">
                                    maximum <input type="number" id="page_width" value="72" min="25" max="200"> characters
                                </div>
                                <div class="control-group">
                                    <input type="checkbox" id="maximize_page" name="maximize_page">
                                    <label for="custom_margins">maximize page area</label>
                                </div>
                            </fieldset>
                            <div class="control-group">
                                <input type="checkbox" id="sidebarReflow" name="sidebarReflow">
                                <label for="sidebarReflow">
                                    reflow text when sidebars are open
                                </label>
                            </div>
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
                    </div>
                    <div id="metainfo" class="nightshift">
                        <span id="book-title">
                        </span>
                        <span id="title-separator">
                              –  
                        </span>
                        <span id="chapter-title">
                        </span>
                    </div>
                    <div id="title-controls">
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
                <div id="viewer">
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
