export function onRequest(){
  return new Response('google-site-verification: googlea1b39620fd8849c7.html\n',{
    status:200,
    headers:{
      'content-type':'text/html; charset=utf-8',
      'cache-control':'public, max-age=300'
    }
  });
}
