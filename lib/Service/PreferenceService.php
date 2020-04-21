<?php
/**
 * @author Frank de Lange
 * @copyright 2017 Frank de Lange
 *
 * This file is licensed under the Affero General Public License version 3 or
 * later.
 * See the COPYING-README file.
 */

namespace OCA\Files_Reader\Service;

use OCA\Files_Reader\Db\PreferenceMapper;

class PreferenceService extends Service {

    // (ab)use the fact that $fileId never goes below 1 by using the
    // value 0 to indicate a default preference
    const DEFAULTS = 0;

    private $preferenceMapper;

    /**
     * @param PreferenceMapper $preferenceMapper
     */
    public function __construct(PreferenceMapper $preferenceMapper) {
        parent::__construct($preferenceMapper);
        $this->preferenceMapper = $preferenceMapper;
    }

    /**
     * @brief get preference
     * 
     * scope identifies preference source, i.e. which renderer the preference applies to
     * preference type is format-dependent, eg CFI for epub, page number for CBR/CBZ, etc
     *
     * @param string $scope
     * @param int $fileId
     * @param string $name
     *
     * @return array
     */
    public function get($scope, $fileId, $name=null) {
        $result = $this->preferenceMapper->get($scope, $fileId, $name);
        return array_map(
            function($entity) {
                return $entity->toService();
            }, $result);
    }

    /**
     * @brief write preference
     *
     * scope identifies preference source, i.e. which renderer the preference applies to
     * position type is format-dependent, eg CFI for epub, page number for CBR/CBZ, etc
     *
     * @param string $scope
     * @param int $fileId
     * @param string $name
     * @param string $value
     *
     * @return array
     */
    public function set($scope, $fileId, $name, $value) {
        return $this->preferenceMapper->set($scope, $fileId, $name, $value);
    }

    /**
     * @brief get default preference
     *
     * @param string $scope
     * @param string $name
     *
     * @return array
     */
    public function getDefault($scope, $name=null) {
        return $this->get($scope, static::DEFAULTS, $name);
    }

    /**
     * @brief set default preference
     *
     * @param string $scope
     * @param string $name
     * @param string $value
     *
     * @return array
     */
    public function setDefault($scope, $name, $value) {
        return $this->preferenceMapper->set($scope, static::DEFAULTS, $name, $value);
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
        foreach($this->preferenceMapper->get($scope, $fileId, $name) as $preference) {
            $this->preferenceMapper->delete($preference);
        }
    }

    /**
     * @brief delete default
     *
     * @param string $scope
     * @param string $name
     *
     */
    public function deleteDefault($scope, $name) {
        $this->delete($scope, static::DEFAULTS, $name);
    }
}
