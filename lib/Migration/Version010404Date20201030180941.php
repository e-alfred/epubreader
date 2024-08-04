<?php

declare(strict_types=1);

namespace OCA\Epubreader\Migration;

use Closure;
use OCP\DB\ISchemaWrapper;
use OCP\Migration\IOutput;
use OCP\Migration\SimpleMigrationStep;

/**
 * Auto-generated migration step
 */
class Version010404Date20201030180941 extends SimpleMigrationStep {

	/**
	 * @param IOutput $output
	 * @param Closure $schemaClosure The `\Closure` returns a `ISchemaWrapper`
	 * @param array $options
	 */
	public function preSchemaChange(IOutput $output, Closure $schemaClosure, array $options) {
	}

	/**
	 * @param IOutput $output
	 * @param Closure $schemaClosure The `\Closure` returns a `ISchemaWrapper`
	 * @param array $options
	 * @return null|ISchemaWrapper
	 */
	public function changeSchema(IOutput $output, Closure $schemaClosure, array $options) {
		/** @var ISchemaWrapper $schema */
		$schema = $schemaClosure();

		if (!$schema->hasTable('reader_bookmarks')) {
			$table = $schema->createTable('reader_bookmarks');
			$table->addColumn('id', 'bigint', [
				'autoincrement' => true,
				'notnull' => true,
				'length' => 8,
				'unsigned' => true,
			]);
			// user ID, maps bookmark to NC/OC user
			$table->addColumn('user_id', 'string', [
				'notnull' => true,
				'length' => 64,
				'default' => '',
			]);
			// file ID, maps to NC/OC file ID
			$table->addColumn('file_id', 'bigint', [
				'notnull' => true,
				'length' => 11,
				'unsigned' => true,
			]);
			// type (bookmark, annotation, etc)
			$table->addColumn('type', 'string', [
				'notnull' => true,
				'length' => 32,
				'default' => '',
			]);
			$table->addColumn('name', 'string', [
				'notnull' => true,
				'length' => 512,
				'default' => '',
			]);
			$table->addColumn('value', 'string', [
				'notnull' => true,
				'length' => 512,
				'default' => '',
			]);
			$table->addColumn('content', 'string', [
				'notnull' => false,
				'length' => 4000,
			]);
			$table->addColumn('last_modified', 'bigint', [
				'notnull' => false,
				'length' => 8,
				'default' => 0,
				'unsigned' => true,
			]);
			$table->setPrimaryKey(['id']);
			$table->addIndex(['file_id'], 'reader_bookmarks_file_id_index');
			$table->addIndex(['user_id'], 'reader_bookmarks_user_id_index');
			$table->addIndex(['name'], 'reader_bookmarks_name_index');
		}

		if (!$schema->hasTable('reader_prefs')) {
			$table = $schema->createTable('reader_prefs');
			$table->addColumn('id', 'bigint', [
				'autoincrement' => true,
				'notnull' => true,
				'length' => 8,
				'unsigned' => true,
			]);
			// user ID, maps preference to NC/OC user
			$table->addColumn('user_id', 'string', [
				'notnull' => true,
				'length' => 64,
				'default' => '',
			]);
			// file ID, maps to NC/OC file ID
			$table->addColumn('file_id', 'bigint', [
				'notnull' => true,
				'length' => 11,
				'unsigned' => true,
			]);
			$table->addColumn('scope', 'string', [
				'notnull' => true,
				'length' => 32,
				'default' => '',
			]);
			$table->addColumn('name', 'string', [
				'notnull' => true,
				'length' => 128,
				'default' => '',
			]);
			$table->addColumn('value', 'string', [
				'notnull' => true,
				'length' => 4000,
				'default' => '',
			]);
			$table->addColumn('last_modified', 'bigint', [
				'notnull' => false,
				'length' => 8,
				'default' => 0,
				'unsigned' => true,
			]);
			$table->setPrimaryKey(['id']);
			$table->addIndex(['file_id'], 'reader_prefs_file_id_index');
			$table->addIndex(['user_id'], 'reader_prefs_user_id_index');
			$table->addIndex(['scope'], 'reader_prefs_scope_index');
		}
		return $schema;
	}

	/**
	 * @param IOutput $output
	 * @param Closure $schemaClosure The `\Closure` returns a `ISchemaWrapper`
	 * @param array $options
	 */
	public function postSchemaChange(IOutput $output, Closure $schemaClosure, array $options) {
	}
}
