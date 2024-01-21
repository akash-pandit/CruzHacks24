import puppeteer, { Browser } from 'puppeteer';
import fs from 'fs';

// store map between ids and the school name
let agreementIDs: { [key: string]: number } = {};

// debug
let counts: { [key: string]: number } = {};

(async () => {
    try {
        // create a puppeteer browser instance
        const browser: Browser = await puppeteer.launch();
        const urls: string[] = [];

        // break set of 150 urls into 15 batches of 10
        for (let i = 1; i <= 150; i++) {  
            let urlBatch: string[] = [];

            // url batch creation --------------------------------------------------------------
            for (let j = 1; j <= 1; j++) { 
                urlBatch.push(`https://assist.org/transfer/results?year=74&institution=132&\
agreement=${i*j}agreementType%3Dfrom&view=agreement&viewBy=major&viewSendingAgreements=false`);
            } // end of url batch creation -----------------------------------------------------
            console.log(urlBatch)
            // load pages for a batch concurrently
            const pages = await Promise.all(urlBatch.map(async (url) => {
                const page = await browser.newPage();
                await page.goto(url);
                return page;
            }));  // end page loading

            // check for html class in all batch pages
            await Promise.all(pages.map(async (page) => {
                await page.waitForSelector('.criteria', {
                    visible: true,
                });
            })); // end batch checking
            
            // grab specific html element from batched pages concurrently, validate, and add to agreementIDs
            await Promise.all(pages.map(async (page, j) => {
                j++;
                const fromSchool: string = await page.$$eval('.criteria', (elements) => {
                    try {
                        let schoolArr: string[] = elements.map(element => element.innerHTML)[1].split('')
                        schoolArr.splice(0, 6);
                        return schoolArr.join('');
                    } catch {
                        throw new Error(`ERROR: Failed to grab schools on batch ${i*j}`);
                    } 
                });
                if (fromSchool in counts) {
                    counts[fromSchool]++;
                } else {
                    counts[fromSchool] = 1;
                }

                
                //add pair to the map if its not a UC/CSU and if its not blank
                if ((!fromSchool.includes("University of California,")) && 
                (!fromSchool.includes(" State University")) && 
                (!fromSchool.includes("California Polytechnic University,"))) {
                    if (fromSchool.length > 3) {
                        agreementIDs[fromSchool] = i*j;
                    } 
                }// end adding pairs 

                await page.close();
            })); // end grabbing elements
            // end current batch
        } // end all batches
        console.log(counts);
        await browser.close();
    } catch (error) {
        console.error('Error:', error);
    }
    // convert map to js object & export as json
    
    const jsonString = JSON.stringify(agreementIDs, null, 4);
    fs.writeFileSync('./data/agreementIDsTEST.json', jsonString, 'utf-8');
})();