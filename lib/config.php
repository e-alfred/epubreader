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

namespace OCA\Epubreader;

/**
 * Config class for Reader
 */
class Config
{
	/**
	 * @brief get user config value
	 *
	 * @param string $key value to retrieve
	 * @param string $default default value to use
	 * @return string retrieved value or default
	 */
	public static function get($key, $default) {
		return \OC::$server->getConfig()->getUserValue(\OCP\User::getUser(), 'epubreader', $key, $default);
	}

	/**
	 * @brief set user config value
	 *
	 * @param string $key key for value to change
	 * @param string $value value to use
	 * @return bool success
	 */
	public static function set($key, $value) {
		return \OC::$server->getConfig()->setUserValue(\OCP\User::getUser(), 'epubreader', $key, $value);
	}

	/**
	 * @brief get app config value
	 *
	 * @param string $key value to retrieve
	 * @param string $default default value to use
	 * @return string retrieved value or default
	 */
	public static function getApp($key, $default) {
		return \OC::$server->getConfig()->getAppValue('epubreader', $key, $default);
	}

	/**
	 * @brief set app config value
	 *
	 * @param string $key key for value to change
	 * @param string $value value to use
	 * @return bool success
	 */
	public static function setApp($key, $value) {
		return \OC::$server->getConfig()->setAppValue('epubreader', $key, $value);
	}
}
