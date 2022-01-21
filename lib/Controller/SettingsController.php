<?php

/**
 * ownCloud - Epubreader App
 *
 * @author Frank de Lange
 * @copyright 2014,2018 Frank de Lange
 *
 * This file is licensed under the Affero General Public License version 3 or
 * later.
 */

namespace OCA\Epubreader\Controller;
use OCP\IRequest;
use OCP\IURLGenerator;
use OCP\AppFramework\Http;
use OCP\AppFramework\Controller;
use OCA\Epubreader\Service\PreferenceService;
use OCA\Epubreader\Config;

class SettingsController extends Controller {
	
	private $urlGenerator;
    private $preferenceService;

    /**
     * @param string $AppName
     * @param IRequest $request
     * @param IURLGenerator $urlGenerator
     * @param PreferenceService $preferenceService
     */
    public function __construct($AppName,
                                IRequest $request,
                                IURLGenerator $urlGenerator,
                                PreferenceService $preferenceService ) {

		parent::__construct($AppName, $request);
        $this->urlGenerator = $urlGenerator;
        $this->preferenceService = $preferenceService;
    }
	
	/**
     * @brief return preference for $fileId
     *
     * @NoAdminRequired
     * @NoCSRFRequired
     *
     * @param string $scope
     * @param int $fileId
     * @param string $name if null, return all preferences for $scope + $fileId 
     *
	 * @return array|\OCP\AppFramework\Http\JSONResponse
	 */
    public function setPreference($scope, $fileId, $name) {
		/*\OC_JSON::callCheck();
		\OC_JSON::checkLoggedIn();*/

		$l = \OC::$server->getL10N('epubreader');

		$EpubEnable = isset($_POST['EpubEnable']) ? $_POST['EpubEnable'] : 'false';
		$PdfEnable = isset($_POST['PdfEnable']) ? $_POST['PdfEnable'] : 'false';
		$CbxEnable = isset($_POST['CbxEnable']) ? $_POST['CbxEnable'] : 'false';

		Config::set('epub_enable', $EpubEnable);
		Config::set('pdf_enable', $PdfEnable);
		Config::set('cbx_enable', $CbxEnable);

		\OC_JSON::success(
			array(
				'data' => array('message'=> $l->t('Settings updated successfully.'))
			)
		);
	}
}