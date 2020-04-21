<?php
/**
 * @author Frank de Lange
 * @copyright 2017 Frank de Lange
 *
 * This file is licensed under the Affero General Public License version 3 or
 * later.
 * See the COPYING-README file.
 */

namespace OCA\Files_Reader\Controller;

use OCP\IRequest;
use OCP\IURLGenerator;
use OCP\AppFramework\Http;
use OCP\AppFramework\Controller;

use OCA\Files_Reader\Service\PreferenceService;

class PreferenceController extends Controller {

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
    public function get($scope, $fileId, $name) {
        return $this->preferenceService->get($scope, $fileId, $name);
    }

	/**
     * @brief write preference for $fileId
     *
     * @NoAdminRequired
     * @NoCSRFRequired
     *
     * @param string $scope
     * @param int $fileId
     * @param string $name
     * @param string $value
     *
	 * @return array|\OCP\AppFramework\Http\JSONResponse
	 */
    public function set($scope, $fileId, $name, $value) {
        return $this->preferenceService->set($scope, $fileId, $name, $value);
	}


	/**
     * @brief return default preference
     *
     * @NoAdminRequired
     * @NoCSRFRequired
     *
     * @param string $scope
     * @param string $name if null, return all default preferences for scope
     *
	 * @return array|\OCP\AppFramework\Http\JSONResponse
	 */
    public function getDefault($scope, $name) {
        return $this->preferenceService->getDefault($scope, $name);
    }

	/**
     * @brief write default preference
     *
     * @NoAdminRequired
     * @NoCSRFRequired
     *
     * @param string $scope
     * @param string $name
     * @param string $value
     *
	 * @return array|\OCP\AppFramework\Http\JSONResponse
	 */
    public function setDefault($scope, $name, $value) {
        return $this->preferenceService->setDefault($scope, $name, $value);
    }

    /**
     * @brief delete preference
     *
     * @param string $scope
     * @param int $fileId
     * @param string $name
     *
     */
    public function delete($scope, $fileId, $name) {
        return $this->preferenceService->delete($scope, $fileId, $name);
    }

    /**
     * @brief delete default preference
     *
     * @param $scope
     * @param $name
     *
     */
    public function deleteDefault($scope, $name) {
        return $this->preferenceService->deleteDefault($scope, $name);
    }
}
