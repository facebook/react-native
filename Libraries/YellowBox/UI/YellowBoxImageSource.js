/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

const PixelRatio = require('../../Utilities/PixelRatio');

const scale = PixelRatio.get();

/**
 * We use inline images for YellowBox in order to avoid display latency due to
 * resource contention with symbolicating stack traces.
 *
 * The following steps were used to create these:
 *
 *   1. Download SVG files from: https://feathericons.com
 *   2. Rasterize SVG files to PNG files at 16dp, 36dp, and 48dp.
 *   3. Convert to Base64: https://www.google.com/search?q=base64+image+encoder
 *
 * @see https://github.com/feathericons/feather
 * @copyright 2013-2017 Cole Bemis
 * @license MIT
 */
const YellowBoxImageSource = {
  alertTriangle: ((scale > 2
    ? 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAB60lEQVRoge2Z3W3DIBSFj9oFPAIjZARGyAiMkBHuJh4hI2QEj5AR3Me+tQ91JALHmD8bKvmTkCr5Auc6/kzUACcnRXzuvL4GoAB8Afjeea9qXADcAfw4475c65orgBl++NeYl5ouUQiHt5tQTRJuwB6b5zLY49QVGn7I0bo+kuv60IQbuHf5CWCIqOkCgX93maia1MkRAUMo+OI+AvUPp7a50EzcUCBF6psJrUkYiZgnZJ7eId8mMeIyhpW5hyLw72LKCXsl86VqwgAKceKapW5e/nZpJnSsuHaTM7muyDq7C63JprJS69YxhNTpSlkpKeLGNHCo0EJChcSNaQA4SGiFtBMXJFSI3YVOPXFB6kMoUl9NaE0Wl4h5KQ0AOwqde+KmNrCL0EKCxJ64qQ0AlYVWSBfXZusgW6Oa0Dni2hiEv0qsoci+yUJrsoikLlKAkP11ygK54taiSOgb/O5b/DMqS+gBZeLWJlnoEX7XwQkBDPIktlEkz7hWrEmxZG4M5L9GXYTk0qxwcopKxa3VABN6cosM/C5LxTUof4ReMKHf1nRlaSnuGsGM7kfU4w8RF5Bz4aNlokLe/HQ/ngl9/Qih4L9k3h4hA1+S3odxu3Q77Hl4r1Hg75n6D01M2Difbp02Mi3ZTk5OLH4BUyEtOlDYuK0AAAAASUVORK5CYII='
    : scale > 1
    ? 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABVklEQVRYheWX4U3DMBBGH4gBMoJHyAgeoSNkAxjBG5QNOkJHCGzQDcoGZQP4gY3Oqe1cEscS4pNOqs9Jvqvv6ZrCf9fDhnutD4A3H810Br4mcW5l7hLmIdze5mZi+OJD5syeBYzC6CjyR5Ef9zI/CJMb0Im9zufC/qG2eQdchcGQuGYQ+9dJgZvl0B2xbJGrZW6IIevFXp9YVwcyB540syJfFcgSeJb0cVcDcg68XAFQCUhH+ShLBcBGIA158LQFqIB8zBRwEp9fgctcxQld/L2pZxZVAk/KkucjaDGQmoknrz35KEE2sABIRxm8tVIBaZgHb61UQOYmXk7aFgQVJ6QWPCnLAriYAVILnpTxD7yh/9EZiIEE4m+y29uMkGy1nQ6i9wYFRB5PwKdYP/v1msmnUe89gn695bG0iqjdXeMiRu9599csvGKZ0jlu0Ac/7d2rxX9Q37HW6QfX/ZguAAAAAElFTkSuQmCC'
    : 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAvUlEQVQ4jbWT4Q3CIBCFP40DdANxg24gIzhKuwEjuIFxAkcwTtARGicoG+iPXlMCB8UfvoQc4e7ePV4A/ogWuMlqc0W7AsEo0QMNcPplugMmwMia5KwKWkNIuIkHq3wLXGQ/Sq4IC3wkLpOfmZyKeEpIEKsDYB8VN0Afkfpg30uNiycbdKcNqXEOxdBEWoEAoqta8uZ0iqqkxwGDUrSFAXAHZpOWd/+ubD5Kz335Cx1wZna4Bh54AddauVl8ARfCLO9Xq7xGAAAAAElFTkSuQmCC'): string),
  check: ((scale > 2
    ? 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAqElEQVRoge3YTQ7CIBRF4bPUu/8JS6gTSaqilh95vuR+CaO2cGgYNAUzMzOzFgHlPhRaMkDAcRoltKaTeIxPtQHxGn+Q5AgJx8cQjo8hHB9DOP76Yiu/RcTmN18WLiQCjs3zBkYXVGOeLWd+xcIr5pgyEzDz7FIjISPP/FRPUM+9W4nvYVfuCSXeB3669ldEOzRFfCUSx1cicXwlEsdXIvEPKDMzM7PMbtugw3XTpNA2AAAAAElFTkSuQmCC'
    : scale > 1
    ? 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAf0lEQVRYhe2UvQ2AIBQGL3EBR3AESkv3bxxFN8DmWUgwvkI+En1X0cBd+IMg+DuDyDMCs413kfMiX4EMbD3l8oCaPIU85B4mYLEF5XJscrYFPRGvb/sZ4IlocubJGdH0wj1FSG77XYT0qdUi5O+8jOjyyZQRUnkZ0UUeBMF3OQC/0VsyGlxligAAAABJRU5ErkJggg=='
    : 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAASElEQVQ4jWNgGJHAgIGBIYESze8ZGBjWU6L5PAMDgwBNNCdAFZJt83qoQmRDSHK2AFQhzBCy/IxsCNkBJsDAwLAfiknWPBIBAETPFeuA4fr6AAAAAElFTkSuQmCC'): string),
  chevronLeft: ((scale > 2
    ? 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAgElEQVRoge3YMQ6DQBAEwRYvnf8nPAECbAnkyATsrt0lXUyPdAE6kCRJ/yXA+jopLbkhwHY6a2nNl8I1ftSA8Bm/MeQKBeNrBONrBONrBONrhMHxcPwOlMUvT32oszD8CoEj+giO6CE4oofgiB7Cj44Y86zyFoYPgOFPi5Ik6WwHji+QVIOyhqgAAAAASUVORK5CYII='
    : scale > 1
    ? 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAYAAADhAJiYAAAAaUlEQVRYhe3WsQ2AMAwAwRcs5LEYg3HpYANoQKKgcEEUI/6adM5LbgySfmZsNDeACdiApdEfaQGswH6+Xd1jugc9xYQxxhjz9RhaxwxvDuul3MrAqDyjsozKKnWgXUqdsJcAZgqsTFJ5B7gjUNw0n0HHAAAAAElFTkSuQmCC'
    : 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAARklEQVQ4jWNgGPKAmUh1AQwMDBIMDAwPyLEkgYGB4T/UELI1J9BdcwCxmpnIMZ1YkECsK+hmCNZoZCHCgAUMDAwfoHg4AgDJuQ/bcLyV+QAAAABJRU5ErkJggg=='): string),
  chevronRight: ((scale > 2
    ? 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAeElEQVRoge3YMQ6AIBQE0Ykn3fs3HEEbC6MdFp+v8xJaspNQAZIkqbcA4zwpXTJpAPvlpHTNhHtAu4jwDDCiQjBiDcGINQQj1hCMWEN4Boy3l25vL/iL0PgJBcfXCI6vERxfIzi+Rmg8Hj7wrdL+Yys0/1qUJEmzDvSAkFQ8EOdJAAAAAElFTkSuQmCC'
    : scale > 1
    ? 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAYAAADhAJiYAAAAZElEQVRYhe3WsQmAQAxA0Y8ulLEcw3HtdANtBNvzCJjD/5pUgQ9pApJ+Zu7YCWABDmDLzemzA+c94+MW4AkqExUY1caoVka1GibqlSm7qJJSJzPGGGMylYqBgi9sACtFYiQN7wKC6VDcJ7tlpQAAAABJRU5ErkJggg=='
    : 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAANUlEQVQ4jWNgGLbAgYGBIYASAwIYGBj+MzAwJFBiSMLQMISJEpMptp2mmimORgcGChPSEAIAHGENPH8gqdYAAAAASUVORK5CYII='): string),
  loader: ((scale > 2
    ? 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAABXElEQVRoge2a3W3DMAyEr+0CHkGjaISOcKN4k6zQETpCR+gGzgbpQ10kcamIpKQ6avQBBPxg3pHwL2UDg/8LASxrcNdKnCwATmssrUyeWgnju/DmXs8tRP+Sh2kgAJga1rFlWj2rcMD5YqQh77QJLbzIORjyRIJQCJW5ngYo5AVlrsgkCGqbsDbAhFfxqZsSZibP0oDXQ43HQPsg82i7sBoR+VcJq2YxKcPo0IoJLRZXmYGC6ezQmQUdVqhPBVH/CNBTSMkLVlzjA8Bbocb7GoPBoADi+umZilYzbrG/JrnljOvy734iu4To/BQaDB6Rl4LciPPF9Lmjhgvi+s7w6tCIGw3WKS0P8fvWNjt0ZkGHFeq7CQXTbkZKGg2JOxrqPUZ3s6ziNdju38IjS/dLi0EQpDLX2gDQYHEX6Hx5/YcA+6H0NgAYPnCMj3x7Mxq4wTGx3Q1E578aDDR8AX0mOGD6BEN/AAAAAElFTkSuQmCC'
    : scale > 1
    ? 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABN0lEQVRYhe2WzU3EMBCFP34KyJEjJaQDXAIlJJ24BSow2wEdhHSwJSwd7JHbcmC0mOxMnDiWDIInWbHkN29exo4n8IvRAEFGU8OAA04yulyR60Jm7msbyIZloAMGwBfI4UWrWxM08LW/weC4iOMNTog4g0awKjBG827GxBwC3996NHizAifsSrTRmlsZm23CT9adktyXSq6ZUPdxgiXnZzW8CLcLuC3lvqA/gCt5NtjlPQL7TP0Wu1HtRRu4PO3T4TKTz2kG+AG9IN6CR/Su9iojBw69egfghWgL/pGCp+JFVPUqTjWjlsuqeAo1o6rt2C8QcNiV0UxoHPMieojmz0CfMKyhl1hN84xbI3gnz5Ftp7kH3iT5LsFdDUf6pzSJ6r2glIFDbuDNhqRH4I7Pvv4EvG/QqocP2Jh/xzzX/zUAAAAASUVORK5CYII='
    : 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAsklEQVQ4jaWTYRHCMAyFP7gJmIQ6oChgEpBQKXMwC3MADpAAEiphDuBHC4QuDRu8u9ylyWtem7Rgw2X7GT1wsghb4beAVzhtsfYyJgs44AoEQzBkjrMId1HkKPwyZ6oMSnxYsnk1NqT7yMo34Fzhd9meGJvs7Hh3NhqCLXDI/rT0lKsR+KOJgc9RdaRRarkZvELogYsi8HqxjUhGYE+aQg1jzketwFTZXHbbEpjB8eU7PwAbLiJz46707gAAAABJRU5ErkJggg=='): string),
};

module.exports = YellowBoxImageSource;
