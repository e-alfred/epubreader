<?php

/**
 * ownCloud - Epubreader App
 *
 * @author Frank de Lange
 * @copyright 2015 - 2017 Frank de Lange
 *
 * This file is licensed under the Affero General Public License version 3 or
 * later.
 */

namespace OCA\Epubreader\AppInfo;

use OCP\AppFramework\App;
use OCP\Util;

$l = \OC::$server->getL10N('epubreader');

\OCA\Epubreader\Hooks::register();
Util::addscript('epubreader', 'plugin');
