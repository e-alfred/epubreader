<?php

/**
 * ownCloud - Files_Reader App
 *
 * @author Frank de Lange
 * @copyright 2015 - 2017 Frank de Lange
 *
 * This file is licensed under the Affero General Public License version 3 or
 * later.
 */

namespace OCA\Files_Reader\AppInfo;

use OCP\AppFramework\App;
use OCP\Util;

$l = \OC::$server->getL10N('files_reader');

\OCA\Files_Reader\Hooks::register();
Util::addscript('files_reader', 'plugin');
\OCP\App::registerPersonal('files_reader', 'personal');
