//Joonas Kaikkonen


//muuttujat
//muuttujia sivun elementtejä varten
var tapahtumaLista = document.getElementById("tapahtumienlista");
var tekstiAlue = document.getElementById("sis");
var noudaNappi = document.getElementById("nouda");
//var resetNappi = document.getElementById("nollaa");

var req;
var haettuTieto;
var kartta;

// viesti tapahtumien hakemisen tilasta
function annaViesti(naytettavaViesti)  {
  tekstiAlue.innerHTML = naytettavaViesti;
}


//karttametodit
//kartan alustaminen Tampereelle
function initMap() {
  kartta = new google.maps.Map(document.getElementById("kartta"), {
    center: {lat: 61.4988, lng: 23.7612},
    zoom: 11,
  });
}
//googlelta katsottu malli geokoodaamiseen
function geocodeAddress(osoite, teksti) {
  var gouKoodaaja = new google.maps.Geocoder();
  gouKoodaaja.geocode({'address': osoite}, function (results, status) {

    if(status === google.maps.geocoder.status.OK){
      laitaMarkkeri(results[0].geometry.location, teksti);
    } else {alert('Geokoodausta ei voida suorittaa. Syynä: ' + status);}
  });
}
//kartalle markkerin asettaminen
function laitaMarkkeri(paikka, teksti) {
  var omaMerkki = new google.maps.Marker({
    title: teksti,
    position: paikka,
    map: kartta});
  omaMerkki.setMap(kartta);
}

//TODO suosikit?
function lisaaSuosikki() {

}
//TODO reittiohjeet?
//google maps api ohjeet?

//kategorian avula haetaan tietoja tapahtumasta palvelusta
function haeTiedot() {
  var asetaKategoria = document.getElementsByName("kateg");
  var lukuMaara = parseInt(document.getElementById("maara").value);
  var kategoria = asetaKategoria.options[asetaKategoria.selectedIndex].value;
  var url = "https://visittampere.fi/api/search?type=event&limit=" + lukuMaara;

  //kategorioiden suodatus
  if(kategoria != 'tyhja'){
    url += "&tag=" + kategoria;
  }

  //XMLHttpRequest-olio tiedonhakuun
  req = new XMLHttpRequest();
  req.onreadystatechange = function (){
    if (req.readyState === 4) {
      if (req.status == 200) {
        //jos tiedonsiirto onnistuu niin tyhjennetään vanhat tapahtumat
        document.getElementById('sis').innerHTML = "";
        //kartta
        initMap();
        //tiedon esitys sivulla
        tiedotRiveiksi();
      }
      else {
        tapahtumaLista.innerHTML = "";
        initMap();
        annaViesti("Tietoja ei voitu noutaa (error code: " + req.statusText + ")")
      }
    }
  };
  req.open("GET", url, true);
  req.send();
}

//tietojen esittäminen verkkosivulla
function tiedotRiveiksi() {
  //tarvittavat muuttujat metodille
  var  i,otsikkoTapahtumalle,tapahtumaSelite,katuOsoite,tapahtumaKaupunki,linkkiTapahtumaan,tapahtumaKuva,alt;
  //aiemmat tapahtumat pois
  tapahtumaLista.innerHTML = "";
  // req-olion palvelimelta haettu merkkijonoesitys
  haettuTieto = JSON.parse(req.responseText);

  //tapahtumien tietojen hakeminen
  for (i = 0; i < haettuTieto.length; i++){
    //tarkistetaan otsikko
    otsikkoTapahtumalle = haettuTieto[i].title != null ? haettuTieto[i].title : "Tapahtumalla ei Otsikkoa";

    //tapahtuman kuvauksen haku
    tapahtumaSelite = haettuTieto[i].description

    linkkiTapahtumaan = haettuTieto[i].contact_info.link;
    //asetetaan korvaava tieto mikäli osaa tiedoista ei ole
    switch (linkkiTapahtumaan){
      case null:
        linkkiTapahtumaan = "Ei vielä kotisivua.";
        break;
    }
    tapahtumaKaupunki = haettuTieto[i].contact_info.city;
    switch (tapahtumaKaupunki) {
      case null:
        katuOsoite ="Kaupunkia ei ole vielä määritelty.";
        break;
    }
    katuOsoite = haettuTieto[i].contact_info.address;
    switch (katuOsoite){
      case null:
        katuOsoite = "Katuosoitetta ei ole vielä määritelty.";
        break;
    }
    //onko tapahtumasta kuvaa?
    if (haettuTieto[i].image != null){
      tapahtumaKuva = haettuTieto[i].image.src;
      alt = haettuTieto[i].image.title;
    } else {tapahtumaKuva = "kuva/ei_loydetty.jpg";}

    var tapahtumaDiv;
    //kohta johon liittää tiedot
    tapahtumaDiv = document.createElement('div');

    //div joka sisältää haettua tietoa - ei vielä aikoja tai linkkiä
    tapahtumaDiv.innerHTML = "<h2><strong>" + otsikkoTapahtumalle + "</strong></h2>" +
    "<img src='" + tapahtumaKuva + "' alt='" + alt + "'>" + "<div id='block'>" +
    "<p>" + tapahtumaSelite + "</p><ul>";


    //aikojen määrittäminen
    var alkuaika;
    var loppuaika;
    if (haettuTieto[i].start_datetime != null && haettuTieto[i].end_datetime != null) {
      alkuaika = new Date(haettuTieto[i].start_datetime);
      loppuaika = new Date(haettuTieto[i].end_datetime);

      //tapahtuman ajan talteenotto
      var localAika = alkuaika.toLocaleString();
      var localAika2 = loppuaika.toLocaleString();

      tapahtumaDiv.innerHTML = tapahtumaDiv.innerHTML +
      "<li>" + localAika + " - " + localAika2 + "</li>";
    }
    else if (haettuTieto[i].times != null) {
      var aika = new Date();
      var tamahetki = aika.getTime();

      var tapahtumanAjat = haettuTieto[i].times.length;
      //jätetään vain kolme aikaa tapahtumille
      if (tapahtumanAjat > 3)
        tapahtumanAjat = 3;
      for (var j = 0; j < tapahtumanAjat; j++) {
        alkuaika = new Date(haettuTieto[i].times[j].start_datetime);
        loppuaika = new Date(haettuTieto[i].times[j].end_datetime);

        //tarkistetaan ettei alkuaika vahingossa lipsahda menneisyyteen
        if (alkuaika >= tamahetki) {
          var alkamisenAika = alkuaika.toLocaleString();
          var paateAika = loppuaika.toLocaleString();

          tapahtumaDiv.innerHTML = tapahtumaDiv.innerHTML +
          "<li>" + alkamisenAika + "  -  " + paateAika + "</li>";
        }
      }
    }
    //tapahtumalla ei ole vielä ajankohtaa
    if (haettuTieto[i].times.length == 0 && haettuTieto[i].start_datetime == null) {
      tapahtumaDiv.innerHTML = tapahtumaDiv.innerHTML + "<li>Tapahtumalle ei ole vielä määritelty ajankohtaa.</li>";
    }

    //tapahtuman tiedot sivulla esitysmuoto
    tapahtumaDiv.innerHTML = tapahtumaDiv.innerHTML +
      "</ul><br><p><strong>" + tapahtumaKaupunki + ":</strong>" + katuOsoite  + "<br>" +
      " Linkki nettisivulle: <a href=''>tapahtumanOtsikko</a></p>" +
      "" + linkkiTapahtumaan +"</div><hr>";

    //liitetään tapahtumaListaan
    tapahtumaLista.appendChild(tapahtumaDiv);

    //asetetaan kaupunki ja katuosoite ja käytetään geokoodausta
    var hakuOsoite;
    hakuOsoite = tapahtumaKaupunki == null ? katuOsoite : katuOsoite == null ? tapahtumaKaupunki :
    katuOsoite + ", " + tapahtumaKaupunki;

    var merkinTeksti = otsikkoTapahtumalle + ": " + hakuOsoite;
    geocodeAddress(hakuOsoite, merkinTeksti);
  }
}


// hae tiedot funktio painikkeen kuuntelija
noudaNappi.addEventListener("click", function(){ haeTiedot() });










