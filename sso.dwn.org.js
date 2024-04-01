// ==UserScript==
// @name         SSO User Export
// @namespace    https://sso.dwbn.org/
// @version      2024-04-01
// @description  Allow to export users from sso
// @author       Andreas Schönefeldt
// @match        https://sso.dwbn.org/accounts/*
// @icon         https://sso.dwbn.org/static/root/apple-touch-icon.fa7199afe17d.png
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    if (document.querySelector('.breadcrumb .active').innerText == 'User List') {

        const exportPage = function () {

            let res = window.localStorage.getItem('tm-result');

            jQuery('.table-striped tbody tr').each(function () {
                const tds = $(this).find('td');

                res += [
                   tds[0].innerText,
                   tds[3].innerText,
                   tds[4].innerText,
                   window.location.origin + jQuery(tds[0]).find('a').attr('href'),
                ].join(',') + '\r\n';
            });

            window.localStorage.setItem('tm-result', res);

            const nextLink = jQuery('.pagination .page-item.active + .page-item');
            const nextPage = parseInt(nextLink.text(), 10);

            console.log(nextLink);
            console.log(nextPage);

            if (nextLink.length && nextPage <= parseInt(window.localStorage.getItem('tm-max'), 10) ) {
                window.localStorage.setItem('tm-current', nextPage);
                window.location.href = nextLink.find('a').attr('href');
            } else {

                window.localStorage.setItem('tm-exporting', '');

                const csvContent = "data:text/csv;charset=utf-8," + res;
                window.location.href = encodeURI(csvContent);
            }
        }


        // are we running an export?
        if (window.localStorage.getItem('tm-exporting')) {


            jQuery('.g10f-filter-row .nav').append('<li class="nav-item"><button disabled class="btn btn-dark">... Exporting ' + window.localStorage.getItem('tm-current') + '/' + window.localStorage.getItem('tm-max') + '</button></li>');

            exportPage();
        } else {
            const button = jQuery('<button type="button" class="btn btn-danger">Export current filter</button>');
            const navIten = jQuery('<li class="nav-item"></li>');

            navIten.append(button);

            jQuery('.g10f-filter-row .nav').append(navIten);

            button.on('click', function () {
                window.localStorage.setItem('tm-max', parseInt(document.querySelector('.pagination .page-item:last-child').innerText, 10));
                window.localStorage.setItem('tm-current', 1);
                window.localStorage.setItem('tm-exporting', true);
                window.localStorage.setItem('tm-result', 'username, email, center, link\r\n');

                exportPage();
            });

        }
    }


})();
