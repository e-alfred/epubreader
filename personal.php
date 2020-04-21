<?php
/**
 * ownCloud - Files_Reader app
 *
 * Copyright (c) 2014,2018 Frank de Lange
 * This file is licensed under the Affero General Public License version 3 or
 * later.
 * See the COPYING-README file.
 */

namespace OCA\Files_Reader;

use OCP\Util;

#$l = \OC::$server->getL10N('files_reader');

$tmpl = new \OCP\Template('files_reader', 'settings-personal');
$EpubEnable = Config::get('epub_enable', 'true');
$PdfEnable = Config::get('pdf_enable', 'true');
$CbxEnable = Config::get('cbx_enable', 'true');
$tmpl->assign('EpubEnable', $EpubEnable);
$tmpl->assign('PdfEnable', $PdfEnable);
$tmpl->assign('CbxEnable', $CbxEnable);

return $tmpl->fetchPage();
