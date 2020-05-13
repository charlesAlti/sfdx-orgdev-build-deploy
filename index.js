const core = require('@actions/core');
const github = require('@actions/github');
const { spawnSync } = require('child_process');

try {
    const type = core.getInput('type');
    const certificate_path = core.getInput('certificate_path');
    const decryption_key = core.getInput('decryption_key');
    const decryption_iv = core.getInput('decryption_iv');
    const clientId = core.getInput('client_id');
    const username = core.getInput('username');
    const manifest_path = core.getInput('manifest_path');
    const data_factory = core.getInput('data_factory');

    console.log('Downloading and installing SFDX cli');

    const wget = spawnSync('wget', ['https://developer.salesforce.com/media/salesforce-cli/sfdx-linux-amd64.tar.xz']);
    // wget.stdout.on("data", data => {
    //     console.log(`stdout: ${data}`);
    // });
    
    // wget.stderr.on("data", data => {
    //     console.log(`stderr: ${data}`);
    // });
    
    // wget.on('error', (error) => {
    //     console.log(`error: ${error.message}`);
    //     throw error; 
    // });
    
    // wget.on("close", code => {
    //     console.log(`child process exited with code ${code}`);
    // });

    spawnSync('mkdir', ['sfdx-cli']);
    spawnSync('tar', ['xJf', 'sfdx-linux-amd64.tar.xz', '-C', 'sfdx-cli', '--strip-components', '1']);
    const instCli = spawnSync('./sfdx-cli/install', );
    // instCli.stdout.on("data", data => {
    //     console.log(`stdout: ${data}`);
    // });
    
    // instCli.stderr.on("data", data => {
    //     console.log(`stderr: ${data}`);
    // });
    
    // instCli.on('error', (error) => {
    //     console.log(`error: ${error.message}`);
    //     throw error; 
    // });
    
    // instCli.on("close", code => {
    //     console.log(`child process exited with code ${code}`);
    // });

    spawnSync('openssl', ['enc', '-nosalt', '-aes-256-cbc', '-d', '-in', certificate_path, '-out', 'server.key', '-base64', '-K', decryption_key, '-iv', decryption_iv]);

    console.log('Authenticating in the target org');

    const instanceurl = type === 'sandbox' ? 'https://test.salesforce.com' : 'https://login.salesforce.com';

    console.log('Instance URL: ' + instanceurl);

    const connect = spawnSync('sfdx', ['force:auth:jwt:grant', '--instanceurl', instanceurl, '--clientid', clientId, '--jwtkeyfile', 'server.key', '--username', username, '--setalias', 'sfdc']);
    // connect.stdout.on("data", data => {
    //     console.log(`stdout: ${data}`);
    // });
    
    // connect.stderr.on("data", data => {
    //     console.log(`stderr: ${data}`);
    // });
    
    // connect.on('error', (error) => {
    //     console.log(`error: ${error.message}`);
    //     throw error; 
    // });
    
    // connect.on("close", code => {
    //     console.log(`child process exited with code ${code}`);
    // });

    const convert = spawnSync('sfdx', ['force:source:convert', '-r', 'force-app/', '-d', 'convertedapi', '-x', manifest_path]);

    const destructive = spawnSync('sfdx', ['force:mdapi:deploy', '-d', 'destructive', '-u', 'sfdc', '--wait', '10', '-g']);

    const deploy = spawnSync('sfdx', ['force:mdapi:deploy', '--wait', '10', '-d', 'convertedapi', '-u', 'sfdc', '--testlevel', 'RunLocalTests']);

    if (data_factory !== '' || data_factory !== null) {
        const apex = spawnSync('sfdx', ['force:apex:execute', '-f', data_factory, '-u', 'sfdc']);
    }

} catch (error) {
    core.setFailed(error.message);
}