<?php
/**
 * ownCloud - Epubreader app
 *
 * Copyright (c) 2014,2018 Frank de Lange
 * This file is licensed under the Affero General Public License version 3 or
 * later.
 * See the COPYING-README file.
 */

namespace OCA\Epubreader;

use OCP\Util;

#$l = \OC::$server->getL10N('epubreader');

$tmpl = new \OCP\Template('epubreader', 'settings-personal');
$EpubEnable = Config::get('epub_enable', 'true');
$CbxEnable = Config::get('cbx_enable', 'true');
$tmpl->assign('EpubEnable', $EpubEnable);
$tmpl->assign('CbxEnable', $CbxEnable);

return $tmpl->fetchPage();
