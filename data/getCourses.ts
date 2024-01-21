import puppeteer, { Browser } from 'puppeteer';
import fs from 'fs';

(async () => {
    try {
        console.log('Before launching Puppeteer');
        const browser: Browser = await puppeteer.launch();
        console.log('Puppeteer launched successfully');
        
        let coursesRaw: { [key: string]: string } = {};

        // iterate over assist URL id for every given program
        for (let pageID: number = 112; pageID <= 150; pageID++) {
            // grab the cc name from its id and filter out UC/CSU schools
            const communityColleges = JSON.parse(fs.readFileSync('./data/agreementIDs.json', 'utf8'));
            if (!(pageID.toString() in communityColleges)) {
                // pageID referencing UC/CSU
                console.log(`page ID ${pageID} referencing UC/CSU, skipped\n`);
                continue;
            }
            coursesRaw['UCSC'] = communityColleges[pageID.toString()]

            // set up a puppeteer page on assist for the given cc
            let url: string = `https://assist.org/transfer/results?year=74&institution=132&\
agreement=${pageID}agreementType%3Dfrom&view=agreement&viewBy=major&viewSendingAgreements=false\
&viewByKey=74%2F${pageID}%2Fto%2F132%2FAllMajors`;
            console.log(`Processing page ${pageID} (${communityColleges[pageID.toString()]})`);
            const page = await browser.newPage();
            console.log(`Page ${pageID} (${communityColleges[pageID.toString()]}) created successfully`);
            await page.goto(url);

            // wait until course data is loaded, skipping over courses with no articulation data
            console.log("Checking for articulation data...")
            try {
                await page.waitForSelector('.rowReceiving', { visible: true });
                await page.waitForSelector('.rowSending', { visible: true });
            } catch (error) {
                console.log(`cc page id ${pageID} has no courses!!!!!!!!!!!!!!!!!!!!\n`)
                await page.close();
                continue;
            }
            console.log("Articulation data found")
            
            // grab all articulated course data for ucsc & the given cc
            const ucscCourses = await page.$$eval('.rowReceiving', element => element.map(element => {
                const text = element.textContent?.trim();
                if (text == null) {
                    return 'NULL';
                } return text;
            }));
            const ccCourses = await page.$$eval('.rowSending', element => element.map(element => {
                const text = element.textContent?.trim();
                if (text == null) {
                    return 'NULL';
                } return text;
            }));
            
            await page.close();
            
            // write course data to the cc's json file
            for (let i = 0; i < ucscCourses.length; i++) {
                coursesRaw[ucscCourses[i]] = ccCourses[i];
            }
            const jsonString = JSON.stringify(coursesRaw, null, 4);
            const fileName = `${pageID}.json`;
            fs.writeFileSync(`./data/ccs/${fileName}`, jsonString, 'utf-8');

            console.log(`Page ${pageID} (${communityColleges[pageID.toString()]}) finished processing\n`);
        }
        await browser.close();
        console.log('Browser closed successfully');
    } catch (error) {
        console.error('An error occurred:', error);
    }
})();
