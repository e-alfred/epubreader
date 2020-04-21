<?php
/**
 * @author Frank de Lange
 * @copyright 2018 Frank de Lange
 *
 * This file is licensed under the Affero General Public License version 3 or
 * later.
 * See the COPYING-README file.
 */

script('files_reader', 'settings');
style('files_reader', 'settings');

?>

<div id="reader-personal" class="section">
	<table><tr><td><h2><?php p($l->t('Reader'));?></h2></td><td>&nbsp;<span class="msg"></span></td></tr></table>
	<p class="settings-hint"><?php p($l->t('Select file types for which Reader should be the default viewer.')); ?></p>

	<p>
		<input type="checkbox" name="EpubEnable" id="EpubEnable" class="checkbox"
			   value="1" <?php if ($_['EpubEnable'] === "true") print_unescaped('checked="checked"'); ?> />
		<label for="EpubEnable">
			<?php p($l->t('Epub'));?>
		</label>
	</p>

	<p>
		<input type="checkbox" name="PdfEnable" id="PdfEnable" class="checkbox"
			   value="1" <?php if ($_['PdfEnable'] === "true") print_unescaped('checked="checked"'); ?> />
		<label for="PdfEnable">
			<?php p($l->t('PDF'));?>
		</label><br/>
	</p>
	<p>
		<input type="checkbox" name="CbxEnable" id="CbxEnable" class="checkbox"
			   value="1" <?php if ($_['CbxEnable'] === "true") print_unescaped('checked="checked"'); ?> />
		<label for="CbxEnable">
			<?php p($l->t('CBR/CBZ'));?>
		</label><br/>
	</p>
</div>
