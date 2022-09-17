import Article from '../components/article';

const Intention = () => {
  const props = {
    title: 'My Intentions with this Site',
    contentHtml: `
      <p>I find it is easier to learn new things when you implement them at the same time.</p>
      <p>As such I'm using this site to learn tech and improve my software development knowledge while I build it.</p>
      <p>I'm not claiming anything in the site is original and will aim to show the resources I've used while learning and building.</p>
      <p>Hopefully though you may find some of it useful.</p>
    `,
  };
  return <Article {...props} />;
};

export default Intention;
