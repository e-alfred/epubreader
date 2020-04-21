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
  $revision = '0048';
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
        <link rel="stylesheet" href="<?php p($urlGenerator->linkTo('files_reader', 'vendor/cbrjs/css/cbr.css')) ?>?v=<?php p($version) ?>">
        <script type="text/javascript" nonce="<?php p($nonce) ?>" src="<?php p($urlGenerator->linkTo('files_reader', 'js/lib/Blob.js')) ?>?v=<?php p($version) ?>"> </script>
        <script type="text/javascript" nonce="<?php p($nonce) ?>" src="<?php p($urlGenerator->linkTo('files_reader', 'vendor/epubjs/libs/jquery.min.js')) ?>?v=<?php p($version) ?>"> </script>
        <script type="text/javascript" nonce="<?php p($nonce) ?>" src="<?php p($urlGenerator->linkTo('files_reader', 'vendor/sindresorhus/screenfull.js')) ?>?v=<?php p($version) ?>"> </script>
        <script type="text/javascript" nonce="<?php p($nonce) ?>" src="<?php p($urlGenerator->linkTo('files_reader', 'vendor/pixastic/pixastic_combined.js')) ?>?v=<?php p($version) ?>"> </script>
        <script type="text/javascript" nonce="<?php p($nonce) ?>" src="<?php p($urlGenerator->linkTo('files_reader', 'vendor/bitjs/archive/archive.js')) ?>?v=<?php p($version) ?>"> </script>
        <script type="text/javascript" nonce="<?php p($nonce) ?>" src="<?php p($urlGenerator->linkTo('files_reader', 'vendor/cbrjs/cbr.js')) ?>?v=<?php p($version) ?>"> </script>

        <?php if ($idevice): ?>
        <link rel="stylesheet" href="<?php p($urlGenerator->linkTo('files_reader', 'vendor/cbrjs/css/idevice.css')) ?>?v=<?php p($version) ?>">
        <?php endif; ?>

        <script type="text/javascript" nonce="<?php p($nonce) ?>" src="<?php p($urlGenerator->linkTo('files_reader', 'js/ready.js')) ?>?v=<?php p($version) ?>"> </script>
    </head>

    <body>
        <!-- data -->
        <!-- /data -->

        <!-- loading progressbar -->
        <div id="progressbar" style="display:none;">
            <span class="progress"><span class="bar"></span></span>
            <br>
            <div class="message"><span class="message-icons"><span class="icon-cloud_download"></span><span class="icon-unarchive"></span></span> <span class="message-text"></span></div>
        </div>
        <!-- /loading progressbar -->

        <!-- toolbar -->
        <div class="toolbar control" name="toolbar">
            <div class="pull-left">
                <button data-trigger="click" data-action="openSidebar" title="open sidebar" class="icon-menu"></button>
            </div>

            <div class="metainfo">
                <span class="book-title"></span>&nbsp;<span class="current-page"></span> / <span class="page-count"></span>
            </div>

            <div class="pull-right">
                <div>
                    <button data-trigger="click" data-action="toggleLayout" title="toggle one/two pages at a time" class="icon-single_page_mode layout layout-single"></button>
                    <button data-trigger="click" data-action="toggleLayout" title="toggle one/two pages at a time" class="icon-double_page_mode layout layout-double"></button>
                </div>
                <div>
                    <button data-trigger="click" data-action="zoomOut" title="zoom out" class="icon-zoom_out"></button>
                </div>
                <div>
                    <button data-trigger="click" data-action="zoomIn" title="zoom in" class="icon-zoom_in"></button>
                </div>
                <div>
                    <button data-trigger="click" data-action="fitWidth" title="fit page to window width" class="icon-icon-fit-width"></button>
                </div>
                <div>
                    <button data-trigger="click" data-action="fitWindow" title="fit page to window" class="icon-icon-fit-window"></button>
                </div>
                <div>
                    <button data-trigger="click" data-action="toggleReadingMode" title="switch reading direction" class="icon-format_textdirection_l_to_r manga-false"></button>
                    <button data-trigger="click" data-action="toggleReadingMode" title="switch reading direction" class="icon-format_textdirection_r_to_l manga-true"></button>
                </div>
                <div>
                    <button data-trigger="click" data-action="toggleFullscreen" title="toggle fullscreen" class="icon-fullscreen fullscreen-false"></button>
                    <button data-trigger="click" data-action="toggleFullscreen" title="toggle fullscreen" class="icon-fullscreen_exit fullscreen-true"></button>
                </div>
                <div class="hide close separator"></div>
                <div class="hide close">
                    <button data-trigger="click" data-action="close" title="close" class="icon-exit"></button>
                </div>
            </div>
        </div>
        <!-- /toolbar -->

        <!-- loading overlay -->
        <div id="cbr-loading-overlay" class="cbr-control control overlay" name="loadingOverlay" style="display:none">
            <img src="<?php p($urlGenerator->linkTo('files_reader', 'img/loading.gif')) ?>">
        </div>
        <!-- /loading overlay -->

        <!-- busy overlay -->
        <div id="cbr-busy-overlay" class="cbr-control control overlay" name="busyOverlay" data-trigger="click" data-action="closeSidebar" style="display:none"></div>
        <!-- /busy overlay -->

        <!-- navigation -->
        <div data-trigger="click" data-action="navigation" data-navigate-side="left" class="cbr-control navigate navigate-left control" name="navigateLeft">
            <span class="icon-navigate_before"></span>
        </div>
        <!-- toggle toolbar (disabled)
            <div data-trigger="click" data-action="toggleToolbar" class="toggle-controls control" name="toggleToolbar"></div>
        -->
        <div data-trigger="click" data-action="navigation" data-navigate-side="right" class="cbr-control navigate navigate-right control" name="navigateRight">
            <span class="icon-navigate_next"></span>
        </div>
        <!-- /navigation -->

        <!-- inline progressbar -->
        <div id="cbr-status" class="cbr-control control" name="progressbar" style="display:none">
            <div id="cbr-progress-bar">
                <div class="progressbar-value"></div>
            </div>
        </div>
        <!-- /inline progressbar -->

        <!-- sidebar -->
        <div class="sidebar control" name="sidebar" id="sidebar">
            <div class="panels">
                <div class="pull-left">
                    <button data-trigger="click" data-action="showToc" title="Table of Contents" class="icon-format_list_numbered toc-view open"></button>
                    <button data-trigger="click" data-action="showBookSettings" title="Book settings" class="icon-rate_review book-settings-view"></button>
                    <button data-trigger="click" data-action="showSettings" title="Default settings" class="icon-settings settings-view"></button>
                </div>
                <div class="pull-right">
                    <button id="toc-populate" data-trigger="click" data-action="tocPopulate" title="generate thumbnails" class="icon-sync" style="display:none"></button>
                    <button data-trigger="click" data-action="closeSidebar" title="close sidebar" class="icon-menu"></button>
                </div>
            </div>
            <div class="toc-view view open">
                <ul id="toc">
                </ul>
            </div>
            <div class="book-settings-view view">
                <div class="metadata">
                    <table>
                        <tr>
                            <td>Title:</td><td class="book-title"></td>
                        </tr>
                        <tr>
                            <td>Format:</td><td class="book-format"></td>
                        </tr>
                        <tr>
                            <td>Page count:</td><td class="book-pagecount"></td>
                        </tr>
                        <tr>
                            <td>Size:</td><td class="book-size"></td>
                        </tr>
                    </table>
                </div>
                <div class="settings-container" name="enhancements" id="enhancements">
                    <label for="enhancements">Image enhancements</label>
                    <form name="image-enhancements" data-trigger="reset" data-action="resetEnhancements">
                        <div class="sliders">
                            <div class="control-group">
                                <label title="adjust brightness" class="icon-brightness_low"></label>
                                <input id="brightness" data-trigger="change" data-action="brightness" type="range" min="-100" max="100" step="1" value="0">
                            </div>
                            <div class="control-group">
                                <label title="adjust contrast" class="icon-contrast"></label>
                                <input id="contrast" data-trigger="change" data-action="brightness" type="range" min="-1" max="1" step="0.1" value="0">
                            </div>
                            <div class="control-group">
                                <label title="sharpen" class="icon-droplet"></label>
                                <input id="sharpen" data-trigger="change" data-action="sharpen" type="range" min="0" max="1" step="0.1" value="0">
                            </div>
                        </div>
                        <div class="control-group pull-left">
                            <input id="image-desaturate" type="checkbox" data-trigger="change" data-action="desaturate">
                            <label for="image-desaturate">desaturate</label>
                            <input id="image-removenoise" type="checkbox" data-trigger="change" data-action="removenoise">
                            <label for="image-removenoise">remove noise</label>
                        </div>
                        <div class="control-group pull-right">
                            <input type="reset" value="reset">
                        </div>
                    </form>
                </div>
            </div>
            <div class="settings-view view">
                <div class="settings-container" name="thumbnail-settings" id="thumbnail-settings">
                    <label for="thumbnail-settings">Thumbnails</label>
                    <div class="control-group pull-left">
                        <input id="thumbnail-generate" data-trigger="change" data-action="thumbnails" type="checkbox">
                        <label for="thumbnail-generate">Thumbnails in index </label>
                    </div>
                    <div class="control-group pull-left">
                        <label for="thumbnail-width">Thumbnail width:</label>
                        <input id="thumbnail-width" data-trigger="change" data-action="thumbnailWidth" type="number" min="50" max="500" step="10" value="200" >
                        <label for="thumbnail-width">px</label>
                    </div>
                </div>
                <div class="settings-container" name="sidebar-settings" id="sidebar-settings">
                    <label for="sidebar-settings">Sidebar</label>
                    <form name="sidebar-preferences" data-trigger="reset" data-action="resetSidebar">
                        <div class="control-group pull-left">
                            <input id="sidebar-wide" data-trigger="change" data-action="sidebarWide" type="checkbox">
                            <label for="sidebar-wide">Use extra-wide sidebar</label>
                        </div>
                        <div class="control-group pull-left">
                            <label for="sidebar-width">Sidebar width:</label>
                            <input id="sidebar-width" data-trigger="change" data-action="sidebarWidth" type="number" min="5" max="100" step="1" value="20" >
                            <label for="sidebar-width">%</label>
                        </div>
                        <div class="control-group pull-right">
                            <input type="reset" value="reset">
                        </div>
                    </form>
                </div>
            </div>
        </div>
        <!-- /sidebar -->
        <canvas id="viewer" style="display:none;"></canvas>
    </body>

</html>
