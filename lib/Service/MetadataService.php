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

use OCP\App\IAppManager;

class MetadataService {

    private $appManager;

    /**
     * @param IAppManager $appManager
     */ 
    public function __construct(IAppManager $appManager) {
        $this->appManager = $appManager;
    }

    /**
     * @brief get metadata item(s)
     *
     * @param int $fileId
     * @param string $name
     *
     * @return array
     */
    public function get($fileId, $name=null) {
        if ($this->appManager->isInstalled('files_opds')) {
            if ($meta = \OCA\Files_Opds\Meta::get($fileId)) {
                if (!empty($name) && array_key_exists($name, $meta)) {
                    return [$item => $meta[$name]];
                } else {
                    return $meta;
                }
            }
        }

        return [];
    }

    /**
     * @brief write metadata to database
     *
     * @param int $fileId
     * @param array $value
     *
     * @return array
     */
    public function setAll($fileId, $value) {
        // no-op for now
        return [];
    }

    /**
     * @brief write metadata item to database
     *
     * @param int $fileId
     * @param string $name
     * @param array $value
     *
     * @return array
     */
    public function set($fileId, $name, $value) {
        // no-op for now
        return [];
    }
}
 
