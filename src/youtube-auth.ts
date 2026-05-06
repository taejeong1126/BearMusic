#!/usr/bin/env node

import 'dotenv/config';
import { google } from 'googleapis';
import readline from 'node:readline';

const oauth2Client = new google.auth.OAuth2(process.env.CLIENT_ID, process.env.CLIENT_SECRET, 'http://localhost:3000/oauth2callback');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (q: string) => new Promise<string>((resolve) => rl.question(q, resolve));

async function main() {
    try {
        console.log('인증 링크 생성 중...');

        const url = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            prompt: 'consent',
            scope: ['https://www.googleapis.com/auth/youtube.upload']
        });

        console.log('\n아래 링크 열어서 로그인한 뒤 code 복사:');
        console.log(url);

        const code = await question('\ncode 입력: ');

        console.log('\n토큰 요청 중...');

        const { tokens } = await oauth2Client.getToken(code);

        console.log('\n완료. 토큰:');
        console.log(JSON.stringify(tokens, null, 2));
    } catch (error) {
        console.error('\n실패:', error);
    } finally {
        rl.close();
    }
}

main();
