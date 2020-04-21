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

use OCA\Files_Reader\Db\ReaderMapper;

abstract class Service {

    protected $mapper;

    public function __construct(ReaderMapper $mapper){
        $this->mapper = $mapper;
    }
}



