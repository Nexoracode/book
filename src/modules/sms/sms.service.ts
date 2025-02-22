import { BadGatewayException, BadRequestException, Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class SmsService {
    constructor() { }
    async sendSms(phone: string, name: string, refId: string) {
        const apiKey = 'GkXMx9wEbGNm30g5DWBvo0p8A1Le8FD8wWx9gk0zEFk=';
        const url = 'https://api2.ippanel.com/api/v1/sms/pattern/normal/send';
        let data = JSON.stringify({
            "code": "0ejt4dkexhr6squ",
            "sender": "+983000505",
            "recipient": phone,
            "variable": {
                "name": name,
                "ref-id": refId
            }
        });
        const config = {
            method: 'post',
            maxBodyLength: Infinity,
            url,
            headers: {
                'Accept': '*/*',
                'apikey': apiKey,
                'Content-Type': 'application/json'
            },
            data
        };
        try {
            const response = await axios.request(config);
            if (response.status === 200) {
                return response.data;
            } else {
                throw new BadRequestException(response.status)
            }
        } catch (e) {
            throw new BadGatewayException(e.message);
        }
    }
}
