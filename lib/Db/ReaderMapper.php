<?php
/**
 * @author Frank de Lange
 * @copyright 2017 Frank de Lange
 *
 * This file is licensed under the Affero General Public License version 3 or
 * later.
 * See the COPYING-README file.
 */

namespace OCA\Epubreader\Db;

use OCP\IDBConnection;
use OCP\AppFramework\Db\QBMapper;
use OCP\AppFramework\Db\Entity;

use OCA\Epubreader\Utility\Time;

abstract class ReaderMapper extends QBMapper {

    /**
     * @var Time
     */
    private $time;

    public function __construct(IDBConnection $db, $table, $entity, Time $time) {
        parent::__construct($db, $table, $entity);
        $this->time = $time;
    }

    public function update(Entity $entity): Entity {
        $entity->setLastModified($this->time->getMicroTime());
        return parent::update($entity);
    }

    public function insert(Entity $entity): Entity {
        $entity->setLastModified($this->time->getMicroTime());
        return parent::insert($entity);
    }
} 
