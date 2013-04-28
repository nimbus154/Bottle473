%#Lists all registered users

<p>User list</p>

<table border="1">
<th> Username </th> <th> Password </th>
%for row in rows:
  <tr>
    <td>{{row.username}}</td>
    <td>{{row.password}}</td>
  </tr>
%end
</table>

<a href="/register">Register!</a>
<a href="/login">Login!</a>
