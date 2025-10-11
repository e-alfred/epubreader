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

namespace OCA\Epubreader\Settings;

use OCP\IL10N;
use OCP\IURLGenerator;
use OCP\Settings\IIconSection;

class PersonalSection implements IIconSection
{
    /** @var IURLGenerator */
    private $urlGenerator;
    /** @var IL10N */
    private $l;

    public function __construct(IURLGenerator $urlGenerator, IL10N $l)
    {
        $this->urlGenerator = $urlGenerator;
        $this->l = $l;
    }

    /**
     * returns the relative path to an 16*16 icon describing the section.
     *
     * @returns string
     */
    public function getIcon()
    {
        return $this->urlGenerator->imagePath('epubreader', 'app.svg');
    }

    /**
     * returns the ID of the section. It is supposed to be a lower case string,
     *
     * @returns string
     */
    public function getID()
    {
        return 'epubreader';
    }

    /**
     * returns the translated name as it should be displayed
     *
     * @return string
     */
    public function getName()
    {
        return $this->l->t('EPUB/CBZ/PDF ebook reader');
    }

    /**
     * returns priority for positioning
     *
     * @return int
     */
    public function getPriority()
    {
        return 20;
    }
}