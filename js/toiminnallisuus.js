
var req;
var haettuTieto;
//muuttujia sivun elementtejä varten
var tapahtumaLista = document.getElementById("tapahtumienlista");
var tekstiAlue = document.getElementById("sis");
var noudaNappi = document.getElementById("nouda");
var resetNappi = document.getElementById("nollaa");

//TODO suosikit?
function lisaaSuosikki() {

}
//TODO reittiohjeet?
//google maps api ohjeet?
//karttametodit
//googlelta katsottu malli geokoodaamiseen
function geocodeAddress(osoite, teksti) {
  var gouKoodaaja = new google.maps.Geocoder();
  gouKoodaaja.geocode({'address': osoite}, function(results, status) {
    if (status === google.maps.GeocoderStatus.OK) {
      laitaMarkkeri(results[0].geometry.location, teksti);
    } else {alert('Geokoodaus ei onnistu. Syy: ' + status);}});
}
function laitaMarkkeri(paikka, teksti) {
  var omaMerkki = new google.maps.Marker({
    title: teksti,
    position: paikka,
    map: kartta});
  omaMerkki.setMap(kartta);
}
var kartta;
//kartan alustamiseen funktio Tampereelle
function initMap() {
  kartta = new google.maps.Map(document.getElementById('kartta'), {
    center: {lat: 61.4988, lng: 23.7612},
    zoom: 11,
  });
}

//runkometodi sivun pyörittämiseen
function haeTiedot()	{
  var asetaKategoria = document.getElementById("kateg");
  var lukuMaara = parseInt(document.getElementById('maara').value);

  //tapahtuman kategoria
  var kategoria = asetaKategoria.options[asetaKategoria.selectedIndex].value;
  var url = "https://visittampere.fi/api/search?type=event&limit=" + lukuMaara;

  //kategorioiden suodatus valinnan avulla
  if (kategoria !== 'tyhja') {
    url += "&tag=" + kategoria;
  }

  //XMLHttpRequest-olio tiedonhakuun
  req = new XMLHttpRequest();
  req.onreadystatechange = function () {

    if (req.readyState == 4) {
      // mikäli tieto siirtyy req -->
      if (req.status == 200) {
        // jos tiedon siirto onnistui, tyhjennetään vanhat
        document.getElementById('sis').innerHTML = "";
        // kartan alustus
        initMap();
        // tiedot sivulle
        tiedotRiveiksi();
      }
      else {
        tapahtumaLista.innerHTML = "";
        initMap();
        annaViesti("Tietoja ei voitu noutaa (error code: "+ req.statusText + ")");
      }
    }
  };
  req.open("GET", url, true);
  req.send();
}

function tiedotRiveiksi() {
  var  i,otsikkoTapahtumalle,tapahtumaSelite,katuOsoite,tapahtumaKaupunki,linkkiTapahtumaan,tapahtumaKuva,alt;

  // req-olion palvelimelta haettu merkkijonoesitys
  haettuTieto = JSON.parse(req.responseText);
  // aiempien tapahtumien tyhjennys
    tapahtumaLista.innerHTML = "";

  // haetaan tapahtumien tiedot
  for (i = 0; i < haettuTieto.length; i++) {
    //otsikon haku
    otsikkoTapahtumalle = haettuTieto[i].title != null ? haettuTieto[i].title : "Tapahtumalla ei otsikkoa.";
    //selitteen haku
    tapahtumaSelite = haettuTieto[i].description;

    //asetetaan korvaava tieto mikäli osaa tiedoista ei ole jo
    linkkiTapahtumaan = haettuTieto[i].contact_info.link;
    switch (linkkiTapahtumaan) {
      case null:
        linkkiTapahtumaan = "Ei vielä kotisivua.";
        break;
    }
    katuOsoite = haettuTieto[i].contact_info.address;
    switch (katuOsoite) {
      case null:
        katuOsoite = "Katuosoitetta ei ole vielä määritelty.";
        break;
    }
    tapahtumaKaupunki = haettuTieto[i].contact_info.city;
    switch (tapahtumaKaupunki) {
      case null:
        tapahtumaKaupunki = "Kaupunkia ei ole vielä määritelty";
        break;
    }

    //onko kuvaa saatavilla?
    if (haettuTieto[i].image != null) {
      tapahtumaKuva = haettuTieto[i].image.src;
      alt = haettuTieto[i].image.title;
    } else {tapahtumaKuva = "img/ei_loydy.jpg";}
    //alt = "Tapahtuman kuva";

    var tapahtumaDiv;
    // luodaan kohta johon liitetään tiedot
    tapahtumaDiv = document.createElement('div');


    // luodaan div joka sisältää haetut tiedot, jatketaan sen käyttöä
    tapahtumaDiv.innerHTML =
      "<h2><strong>" + otsikkoTapahtumalle + "</strong></h2>" +
      "<img src='" + tapahtumaKuva + "' alt='" + alt + "'>" +
      "<div id='block'>" + "<p>" + tapahtumaSelite + "</p><ul>";


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

      var aikoja = haettuTieto[i].times.length;
      //jätetään vain kolme aikaa tapahtumille
      if (aikoja > 3) {
        aikoja = 3;
      }
      for (var j = 0; j < aikoja; j++) {
        alkuaika = new Date(haettuTieto[i].times[j].start_datetime);
        loppuaika = new Date(haettuTieto[i].times[j].end_datetime);

        //tarkistetaan ettei alkuaika vahingossa lipsahda menneisyyteen
        if (alkuaika >= tamahetki) {
          var alkamisenAika = alkuaika.toLocaleString();
          var paateAika = loppuaika.toLocaleString();

          tapahtumaDiv.innerHTML = tapahtumaDiv.innerHTML + "<li>" + alkamisenAika + "  -  " + paateAika + "</li>";
        }
      }
    }
    if (haettuTieto[i].times.length == 0 && haettuTieto[i].start_datetime == null) {
      tapahtumaDiv.innerHTML = tapahtumaDiv.innerHTML +
      "<li>Tapahtumalle ei ole vielä määritelty ajankohtaa.</li>";
    }

    //tapahtuman tiedot sivulla esitys
    tapahtumaDiv.innerHTML = tapahtumaDiv.innerHTML +
    "</ul><br><p><strong>" + tapahtumaKaupunki + ":</strong>" + katuOsoite  + "<br>" +
    " Linkki nettisivulle: <a href='linkkiTapahtumaan'>tapahtumanOtsikko</a></p>" + "" + linkkiTapahtumaan +"</div><hr>";

    //liitetään div tapahtumaListaan
    tapahtumaLista.appendChild(tapahtumaDiv);


    //asetetaan kaupunki ja katuosoite geokoodaajalle
    var hakuOsoite;
    hakuOsoite = tapahtumaKaupunki == null ? katuOsoite : katuOsoite == null ? tapahtumaKaupunki :
    katuOsoite + ", " + tapahtumaKaupunki;
    var merkinTeksti = otsikkoTapahtumalle + ": " + hakuOsoite;

    geocodeAddress(hakuOsoite, merkinTeksti);
  }
}


// hae tiedot funktio painikkeen kuuntelija
noudaNappi.addEventListener("click", function(){ haeTiedot() });
//haetut tiedot muuttujassa


//kenttien tyhjennysfunktio, ei toimi vielä kokonaan
function nollaaTiedot() {
  document.getElementById("kaavake").reset();
  document.getElementById("tapahtumienlista").innerHTML = "";
  initMap();

}
//kuuntelija reset painikkeelle
resetNappi.addEventListener("click", function(){ nollaaTiedot() });

// viesti tapahtumien hakemisen tilasta
function annaViesti(naytettavaViesti)  {
  tekstiAlue.innerHTML = naytettavaViesti;
}
